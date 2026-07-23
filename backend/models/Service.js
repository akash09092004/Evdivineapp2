const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    duration: {
      type: String,
      default: "30 min",
    },

    category: {
      type: String,
      enum: [
        "Astrology",
        "Aura Reading",
        "Numerology",
        "Palm Reading",
        "Psychic Reading",
        "Tarot Reading",
        "Vastu Consultation",
        "Other",
      ],
      default: "Other",
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);