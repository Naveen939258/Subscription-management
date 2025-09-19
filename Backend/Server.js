import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import crypto from "crypto";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- CONFIG --------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// -------------------- DB CONNECTION --------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// -------------------- MODELS --------------------

// User Model
// User Model
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

// Plan Model (UPDATED)
const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Fibernet","Prepaid", "Postpaid"], required: true },
  speed: { type: String }, // e.g. "100Mbps"
  dataQuota: { type: String }, // e.g. "500GB"
  price: { type: Number, required: true },
  duration: {
    type: String,
    enum: ["1 Monthly", "3 Monthly", "6 Monthly", "Yearly"],
    required: true,
  },
  description: { type: String },
  features: { type: [String], default: [] },
});
const Plan = mongoose.model("Plan", planSchema);
const connectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // "Home WiFi", "Office Fiber"
  type: { type: String, enum: ["fiber","broadband","mobile"], default: "fiber" },

  address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
      isDefault: { type: Boolean, default: false },
    },

  status: { type: String, enum: ["Active","Inactive"], default: "Active" },

  currentSubscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  queuedSubscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },

}, { timestamps: true });

const Connection = mongoose.model("Connection", connectionSchema);

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Connection", required: true },

  plan: { type: String, required: true },
  planPrice: { type: Number, required: true },   // base price of plan
  finalAmountPaid: { type: Number, required: true },
  duration: String,
  startDate: Date,
  endDate: Date,

  status: { type: String, enum: ["Active","Queued","Expired","Cancelled"], default: "Queued" },

  // Razorpay
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  promoCode: String,
  creditApplied: { type: Number, default: 0 },
}, { timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);


// -------------------- RAZORPAY --------------------
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
// -------------------- AUTH MIDDLEWARE --------------------
const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// -------------------- AUTH ROUTES --------------------

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, phone, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, phone, isAdmin });
    await user.save();
    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "User already exists or invalid data" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ user: { id: user._id } }, JWT_SECRET);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
        isBlocked: user.isBlocked,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// Create Default Admin
app.get("/create-default-admin", async (req, res) => {
  try {
    const email = "admin@example.com";
    const password = "Admin@123";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ message: "Admin already exists", email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      username: "Super Admin",
      email,
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    res.json({ message: "Default admin created", email, password });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get My Profile
app.get("/auth/me", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update My Profile
app.put("/auth/me", fetchUser, async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    let updateData = { username, email, phone };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// -------------------- ADMIN USER MANAGEMENT --------------------

// Get All Users
app.get("/admin/users", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update User (Edit modal)
app.put("/admin/users/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block/Unblock User
app.patch("/admin/users/:id/block", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = !user.isBlocked;
    user.status = user.isBlocked ? "Inactive" : "Active";
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete("/admin/users/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- PLAN CRUD --------------------

// Create Plan
app.post("/admin/plans", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const { name, type, speed, dataQuota, price, duration, description, features } =
      req.body;

    const plan = new Plan({
      name,
      type,
      speed,
      dataQuota,
      price,
      duration,
      description,
      features,
    });

    await plan.save();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Plans
app.get("/admin/plans", fetchUser, async (_req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Plan
app.put("/admin/plans/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const { name, type, speed, dataQuota, price, duration, description, features } =
      req.body;

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, type, speed, dataQuota, price, duration, description, features },
      { new: true }
    );

    res.json(updatedPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Plan
app.delete("/admin/plans/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// -------------------- PUBLIC PLANS (for users) --------------------
app.get("/plans", async (_req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- DISCOUNTS --------------------

// Discount Model
const discountSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Festival Offer"
    code: { type: String, unique: true, required: true }, // e.g. "FEST50"
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true }, // % or ₹
    description: { type: String },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Discount = mongoose.model("Discount", discountSchema);

// Create Discount (Admin Only)
app.post("/api/discounts", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const { title, code, type, value, description } = req.body;

    const discount = new Discount({ title, code, type, value, description });
    await discount.save();

    res.json(discount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Discounts
app.get("/api/discounts", async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ createdAt: -1 });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Discount (Admin)
app.put("/api/discounts/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Discount (Admin)
app.delete("/api/discounts/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    await Discount.findByIdAndDelete(req.params.id);
    res.json({ message: "Discount deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats for Dashboard
// -------------------- DISCOUNTS STATS --------------------
app.get("/api/discounts/stats", async (req, res) => {
  try {
    const discounts = await Discount.find();

    // Active discounts
    const active = discounts.filter((d) => d.isActive).length;

    // ✅ Total usage = count ALL subs that used promoCode (Active + Expired + Cancelled)
    const totalUsage = await Subscription.countDocuments({
      promoCode: { $exists: true, $ne: "" },
    });

    // ✅ Total revenue = only Active + Expired (exclude Cancelled)
    const totalRevenueAgg = await Subscription.aggregate([
      {
        $match: {
          promoCode: { $exists: true, $ne: "" },
          status: { $in: ["Active", "Expired"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmountPaid" },
        },
      },
    ]);
    const totalRevenue =
      totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    // ✅ Avg conversion = how many subscribers (including Cancelled) used promoCode / total subscribers
    const totalSubscribers = await Subscription.countDocuments();
    const avgConversion =
      totalSubscribers > 0
        ? ((totalUsage / totalSubscribers) * 100).toFixed(1)
        : 0;

    res.json({ active, totalUsage, totalRevenue, avgConversion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Apply Discount on Checkout
app.post("/api/discounts/apply", fetchUser, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const discount = await Discount.findOne({ code, isActive: true });
    if (!discount) {
      return res.status(404).json({ success: false, message: "Invalid or expired discount code" });
    }

    let discountAmount = 0;
    let finalAmount = orderAmount;

    if (discount.type === "percentage") {
      discountAmount = (orderAmount * Number(discount.value)) / 100;
    } else if (discount.type === "flat") {
      discountAmount = Number(discount.value);
    }

    finalAmount = Math.max(0, orderAmount - discountAmount);

    // Track analytics properly
    discount.usageCount += 1;
    discount.revenueGenerated += discountAmount; // ✅ track discount used
    await discount.save();

    res.json({
      success: true,
      finalAmount,
      discountAmount,
      discountCode: discount.code,
    });
  } catch (err) {
    console.error("Promo apply error:", err);
    res.status(500).json({ success: false, message: "Server error", details: err.message });
  }
});
// Add new connection
app.post("/connection/add", fetchUser, async (req, res) => {
  try {
    const { name, type, address } = req.body;

    const connection = new Connection({
      userId: req.user.id,
      name,
      type,
      address, // full object (name, phone, street, etc.)
    });

    await connection.save();
    res.json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get my connections
app.get("/connection/my", fetchUser, async (req,res)=>{
  const conns = await Connection.find({ userId: req.user.id })
    .populate("currentSubscription queuedSubscription");

  for (let conn of conns) {
if (conn.currentSubscription && 
   (conn.currentSubscription.endDate < new Date() || conn.currentSubscription.status === "Cancelled")) {
      // Expire current
      await Subscription.findByIdAndUpdate(conn.currentSubscription._id, { status: "Expired" });
      conn.currentSubscription = null;

      // Promote queued if exists
      if (conn.queuedSubscription) {
        const queued = await Subscription.findById(conn.queuedSubscription._id);
        queued.status = "Active";
        queued.startDate = new Date();
        let months = 1;
        if(queued.duration==="3 Monthly") months=3;
        else if(queued.duration==="6 Monthly") months=6;
        else if(queued.duration==="Yearly") months=12;
        queued.endDate = new Date();
        queued.endDate.setMonth(queued.startDate.getMonth()+months);
        await queued.save();

        conn.currentSubscription = queued._id;
        conn.queuedSubscription = null;
      }

      await conn.save();
    }
  }

  res.json(conns);
});
// -------------------- CONNECTION MANAGEMENT --------------------

// Update connection (name, type, address, status, etc.)
app.put("/connection/update/:id", fetchUser, async (req, res) => {
  try {
    const updated = await Connection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // only owner can update
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Connection not found" });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete connection
app.delete("/connection/delete/:id", fetchUser, async (req, res) => {
  try {
    const deleted = await Connection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // only owner can delete
    });

    if (!deleted) return res.status(404).json({ error: "Connection not found" });

    res.json({ success: true, message: "Connection deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// -------------------- ADMIN CONNECTION MANAGEMENT --------------------

// Get all connections (with user + subscription info)
app.get("/admin/connections", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.isAdmin)
      return res.status(403).json({ error: "Not authorized" });

    const connections = await Connection.find()
      .populate("userId", "username email phone")
      .populate("currentSubscription queuedSubscription");

    res.json(
      connections.map((c) => ({
        _id: c._id,
        name: c.name,
        type: c.type,
        status: c.status,
        user: c.userId,
        address: c.address,
        currentSubscription: c.currentSubscription,
        queuedSubscription: c.queuedSubscription,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update connection (admin override)
app.put("/admin/connections/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.isAdmin)
      return res.status(403).json({ error: "Not authorized" });

    const updated = await Connection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("userId", "username email phone");

    if (!updated) return res.status(404).json({ error: "Connection not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete connection (admin override)
app.delete("/admin/connections/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.isAdmin)
      return res.status(403).json({ error: "Not authorized" });

    const deleted = await Connection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Connection not found" });

    res.json({ message: "Connection deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- SUBSCRIPTION --------------------
// Create order for a subscription
app.post("/subscription/create-order", fetchUser, async (req,res)=>{
  try {
    const { connectionId, planId, promoCode } = req.body;

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ error: "Connection not found" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    let finalAmount = plan.price;
// Apply promo code if provided
if (promoCode) {
  const discount = await Discount.findOne({ code: promoCode, isActive: true });
  if (discount) {
    if (discount.type === "percentage") {
      finalAmount -= (plan.price * discount.value) / 100;
    } else if (discount.type === "flat") {
      finalAmount -= discount.value;
    }
    finalAmount = Math.max(0, finalAmount);
  }
}

    // TODO: apply promo logic like before

    const options = {
      amount: finalAmount * 100,
      currency: "INR",
      receipt: "sub_"+Date.now(),
      notes: { userId: req.user.id, plan: plan.name }
    };
    const order = await razorpay.orders.create(options);

    res.json({ order, key: RAZORPAY_KEY_ID, finalAmount });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify and activate subscription
// ✅ Verify and activate subscription
app.post("/subscription/verify", fetchUser, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      connectionId,
      planId,
      promoCode,
      finalAmount,
    } = req.body;

  
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }


    // --- Plan and connection logic ---
    const plan = await Plan.findById(planId);
    const connection = await Connection.findById(connectionId).populate(
      "currentSubscription"
    );

    let months = 1;
    if (plan.duration === "3 Monthly") months = 3;
    else if (plan.duration === "6 Monthly") months = 6;
    else if (plan.duration === "Yearly") months = 12;

    const startDate = new Date();
    let status = "Active";

    if (
      connection.currentSubscription &&
      connection.currentSubscription.status === "Active"
    ) {
      status = "Queued";
    }

    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + months);

    const sub = new Subscription({
      userId: req.user.id,
      connectionId,
      plan: plan.name,
      planPrice: plan.price,
      finalAmountPaid: finalAmount, 
      duration: plan.duration,
      startDate: status === "Queued" ? null : startDate,
      endDate: status === "Queued" ? null : endDate,
      status,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      promoCode: promoCode || null,
    });

    await sub.save();

    if (status === "Active") {
      connection.currentSubscription = sub._id;
    } else {
      connection.queuedSubscription = sub._id;
    }

    await connection.save();


    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// My subscriptions for a connection
app.get("/subscription/my/:connectionId", fetchUser, async (req,res)=>{
  const subs = await Subscription.find({
    userId: req.user.id, connectionId: req.params.connectionId
  }).sort({ createdAt:-1 });
  res.json(subs);
});

// Get all subscriptions for logged-in user (no connectionId required)
app.get("/subscription/my", fetchUser, async (req,res) => {
  try {
    const subs = await Subscription.find({ userId: req.user.id })
    .populate("connectionId", "name")
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel subscription
app.put("/subscription/cancel/:id", fetchUser, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "Cancelled" },
      { new: true }
    );

    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    const conn = await Connection.findById(sub.connectionId).populate("queuedSubscription");

    if (conn && conn.queuedSubscription) {
      // Promote queued to active
      const queued = conn.queuedSubscription;
      queued.status = "Active";
      queued.startDate = new Date();
      let months = 1;
      if (queued.duration === "3 Monthly") months = 3;
      else if (queued.duration === "6 Monthly") months = 6;
      else if (queued.duration === "Yearly") months = 12;
      queued.endDate = new Date();
      queued.endDate.setMonth(queued.startDate.getMonth() + months);
      await queued.save();

      conn.currentSubscription = queued._id;
      conn.queuedSubscription = null;
    } else {
      // No queued → mark active as expired
      sub.status = "Expired";
      await sub.save();
      conn.currentSubscription = null;
    }

    await conn.save();
    res.json({ success: true, message: "Subscription cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Create Razorpay order for upgrade
app.post("/subscription/upgrade/create-order", fetchUser, async (req, res) => {
  try {
    const { connectionId, newPlanId, promoCode } = req.body; // include promoCode

    const conn = await Connection.findById(connectionId).populate("currentSubscription");
    if (!conn) return res.status(404).json({ error: "Connection not found" });

    const currentSub = conn.currentSubscription;
    if (!currentSub || currentSub.status !== "Active") {
      return res.status(400).json({ error: "No active subscription to upgrade" });
    }

    const newPlan = await Plan.findById(newPlanId);
    if (!newPlan) return res.status(404).json({ error: "New plan not found" });

    // --- Calculate credit ---
    const today = new Date();
    const totalDays = Math.ceil((currentSub.endDate - currentSub.startDate) / (1000*60*60*24));
    const remainingDays = Math.ceil((currentSub.endDate - today) / (1000*60*60*24));
    const credit = Math.max(0, Math.round((currentSub.planPrice / totalDays) * remainingDays));

    // --- Calculate final amount with credit ---
    let finalAmount = Math.max(0, newPlan.price - credit);

    // --- Apply promo code ---
    if (promoCode) {
      const discount = await Discount.findOne({ code: promoCode, isActive: true });
      if (discount) {
        if (discount.type === "percentage") finalAmount -= (finalAmount * discount.value) / 100;
        else if (discount.type === "flat") finalAmount -= discount.value;
        finalAmount = Math.max(0, finalAmount);
      }
    }

    // --- Create Razorpay Order ---
    const options = {
      amount: finalAmount * 100,
      currency: "INR",
      receipt: "upgrade_" + Date.now(),
      notes: { userId: req.user.id, connectionId, oldPlan: currentSub.plan, newPlan: newPlan.name, promoCode: promoCode || null }
    };
    const order = await razorpay.orders.create(options);

    res.json({ success: true, order, key: RAZORPAY_KEY_ID, finalAmount, credit, newPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify and activate upgraded subscription
app.post("/subscription/upgrade/verify", fetchUser, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, connectionId, newPlanId, promoCode } = req.body;

    // --- Verify Razorpay signature ---
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const conn = await Connection.findById(connectionId).populate("currentSubscription");
    const newPlan = await Plan.findById(newPlanId);
    if (!conn || !newPlan) return res.status(404).json({ error: "Connection/Plan not found" });

    const currentSub = conn.currentSubscription;

    // --- Expire current subscription ---
    if (currentSub) {
      currentSub.status = "Expired";
      await currentSub.save();
    }

    // --- Calculate credit and finalAmount ---
    const today = new Date();
    const totalDays = Math.ceil((currentSub.endDate - currentSub.startDate) / (1000*60*60*24));
    const remainingDays = Math.ceil((currentSub.endDate - today) / (1000*60*60*24));
    const credit = Math.max(0, Math.round((currentSub.planPrice / totalDays) * remainingDays));

    let finalAmount = Math.max(0, newPlan.price - credit);

    if (promoCode) {
      const discount = await Discount.findOne({ code: promoCode, isActive: true });
      if (discount) {
        if (discount.type === "percentage") finalAmount -= (finalAmount * discount.value) / 100;
        else if (discount.type === "flat") finalAmount -= discount.value;
        finalAmount = Math.max(0, finalAmount);
      }
    }

    // --- Calculate start & end dates ---
    let months = 1;
    if (newPlan.duration === "3 Monthly") months = 3;
    else if (newPlan.duration === "6 Monthly") months = 6;
    else if (newPlan.duration === "Yearly") months = 12;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + months);

    // --- Create upgraded subscription ---
    const upgraded = new Subscription({
      userId: req.user.id,
      connectionId,
      plan: newPlan.name,
      planPrice: newPlan.price,
      finalAmountPaid: finalAmount,
      duration: newPlan.duration,
      startDate,
      endDate,
      status: "Active",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      creditApplied: credit,
      promoCode: promoCode || null,
    });

    await upgraded.save();

    conn.currentSubscription = upgraded._id;
    conn.queuedSubscription = null;
    await conn.save();

    res.json({ success: true, subscription: upgraded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- ADMIN SUBSCRIPTION MANAGEMENT --------------------

// Get all subscriptions (Admin)
// -------------------- ADMIN SUBSCRIPTION MANAGEMENT --------------------

// Get all subscriptions (Admin)
app.get("/admin/subscriptions", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const subscriptions = await Subscription.find()
      .populate("userId", "username email")
      .populate("connectionId", "name")
      .sort({ createdAt: -1 });

    const subsFormatted = subscriptions.map((sub) => ({
      _id: sub._id,
      userId: sub.userId._id,
      userName: sub.userId.username,
      userEmail: sub.userId.email,
      connectionName: sub.connectionId ? sub.connectionId.name : "-",
      planName: sub.plan,
      price: sub.planPrice || 0,
      duration: sub.duration,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      finalAmountPaid: sub.finalAmountPaid || 0,
      creditApplied: sub.creditApplied || 0,
      promoCode: sub.promoCode || "-",
      razorpayPaymentId: sub.razorpayPaymentId || "-",
      createdAt: sub.createdAt,
    }));

    res.json(subsFormatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete / Cancel Subscription (Admin)
app.delete("/admin/subscription/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    res.json({ message: "Subscription cancelled", subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Subscription (Admin Edit)
app.put("/admin/subscription/:id", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    // Prevent editing if subscription is cancelled
    if (sub.status === "Cancelled") {
      return res.status(400).json({ error: "Cancelled subscriptions cannot be edited" });
    }

    const { status, planName, startDate, endDate, promoCode } = req.body;

    const updatedSub = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        status,
        plan: planName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        promoCode: promoCode || null,
      },
      { new: true }
    );

    res.json(updatedSub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ must have
  name: { type: String, required: true },     // Full Name
    phone: { type: String, required: true },    // Phone number
    street: { type: String, required: true },   // Street address
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const Address = mongoose.model("Address", addressSchema);
app.post("/address/add", fetchUser, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const address = new Address({
      userId: req.user.id,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault,
    });

    await address.save();
    res.json({ success: true, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/address/update/:id", fetchUser, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, phone, street, city, state, pincode, country, isDefault },
      { new: true }
    );

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/address/list", fetchUser, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/address/delete/:id", fetchUser, async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- ADMIN PLANS STATS --------------------
// -------------------- ADMIN PLANS STATS --------------------
app.get("/admin/stats/plans", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.isAdmin) return res.status(403).json({ error: "Not authorized" });

    // ✅ Count ALL subscribers (Active + Expired + Cancelled)
    const totalSubscribers = await Subscription.countDocuments();

    // ✅ Current month range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // ✅ Calculate monthly revenue (Active + Expired only, exclude Cancelled)
    const monthlyPayments = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ["Active", "Expired"] },
          startDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmountPaid" },
        },
      },
    ]);

    const monthlyRevenue =
      monthlyPayments.length > 0 ? monthlyPayments[0].total : 0;

    res.json({
      totalSubscribers,
      monthlyRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const calculateMatch = (currentPlan, newPlan) => {
  let match = 50; // base match

  if (!currentPlan) return match; // guest or no active plan

  // Reward higher speed and data than current plan
  const speedCurrent = parseInt(currentPlan.speed) || 50;
  const speedNew = parseInt(newPlan.speed) || 50;
  const dataCurrent = currentPlan.dataQuota === "Unlimited" ? Infinity : parseInt(currentPlan.dataQuota);
  const dataNew = newPlan.dataQuota === "Unlimited" ? Infinity : parseInt(newPlan.dataQuota);

  if (speedNew > speedCurrent) match += 20;
  if (dataNew > dataCurrent) match += 20;

  // Reduce match if price is higher
  if (newPlan.price > currentPlan.price) match -= 10;

  return Math.min(100, match);
};

app.get("/api/recommendations", fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current subscriptions
    const subs = await Subscription.find({ userId, status: "Active" });
    const currentPlan = subs.length > 0 ? await Plan.findOne({ name: subs[0].plan }) : null;

    // Fetch all plans
    const allPlans = await Plan.find();

    // Filter out current plan(s)
    const recommendations = allPlans
      .filter((p) => !currentPlan || p.name !== currentPlan.name)
      .map((p) => ({
        name: p.name,
        speed: p.speed || "50 Mbps",
        data: p.dataQuota || "Unlimited",
        price: p.price,
        match: calculateMatch(currentPlan, p),
      }))
      .sort((a, b) => b.match - a.match) // highest match first
      .slice(0, 5); // top 5 recommendations

    res.json(recommendations);
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});
const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional, if per-user notifications
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

// -------------------- Feedback Schema --------------------
const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    feedback: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true }, // restrict to 1–5 stars
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);


// API Route
app.post("/api/feedback", async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    await newFeedback.save();
    res.status(201).json({ message: "Feedback saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save feedback" });
  }
});
// Send new notification (Admin)
app.post("/admin/notifications", async (req, res) => {
  try {
    const { message } = req.body;
    await Notification.create({ message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user notifications
app.get("/notifications", async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
app.put("/notifications/mark-read", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------- SERVER --------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
