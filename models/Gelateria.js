const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gelateriaSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique:true
  },
  photoURL: {
    type: String,
    required:false,
  },
});

module.exports = mongoose.model("Gelateria", gelateriaSchema);
