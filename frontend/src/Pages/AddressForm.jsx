import React, { useState, useEffect } from "react";

const AddressForm = ({ onSave, editingAddress, onCancel }) => {
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  // Load data when editing
  useEffect(() => {
    if (editingAddress) {
      setAddress(editingAddress);
    }
  }, [editingAddress]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddress({ ...address, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(address); // send updated/new address to parent
    setAddress({
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    });
  };

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <input name="name" placeholder="Full Name" value={address.name} onChange={handleChange} required />
      <input name="phone" placeholder="Phone Number" value={address.phone} onChange={handleChange} required />
      <input name="street" placeholder="Street Address" value={address.street} onChange={handleChange} required />
      <input name="city" placeholder="City" value={address.city} onChange={handleChange} required />
      <input name="state" placeholder="State" value={address.state} onChange={handleChange} required />
      <input name="pincode" placeholder="Pincode" value={address.pincode} onChange={handleChange} required />
      <input name="country" placeholder="Country" value={address.country} onChange={handleChange} />

      <label>
        <input type="checkbox" name="isDefault" checked={address.isDefault} onChange={handleChange} /> Set as default
      </label>

      <button type="submit">{editingAddress ? "Update Address" : "Save Address"}</button>
      {editingAddress && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
};

export default AddressForm;
