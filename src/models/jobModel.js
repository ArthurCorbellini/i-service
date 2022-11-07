const mongoose = require("mongoose");
const msg = require("../../languages/pt-BR.json");

const jobSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "name")],
      trim: true,
      maxlength: [
        40,
        msg["vld.maxlength"]
          .replace("{{field}}", "name")
          .replace("{{size}}", "40"),
      ],
    },
    description: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "description")],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, msg["vld.required"].replace("{{field}}", "price")],
    },
    provider: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, msg["vld.required"].replace("{{field}}", "provider")],
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // ratingsAverage
    // ratingsQuantity
    imageCover: String,
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // nunca retorna essa variável no select
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toOject: { virtuals: true },
  }
);

// cria um campo "review" no "job" e popula com as reviews que apontam para este mesmo job;
//  -> não persiste a "review" no document "job", apenas injeta um model dentro do outro;
//  -> por default, ele só vai popular "reviews" se for chamado um ".populate("review")" na query;
jobSchema.virtual("reviews", {
  ref: "Review", // referência do model que será injetado;
  foreignField: "job", // nome do campo presente no model injetado que referencia o model local;
  localField: "_id", // referência do model local para onde o "foreignField" aponta;
});

// inclui na query para remover o parâmetro active = false;
jobSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// inclui na query para popular o parâmetro "provider", porém sem alguns atributos;
jobSchema.pre(/^find/, function (next) {
  this.populate({
    path: "provider",
    select: "-__v -passwordChangedAt",
  });
  next();
});

module.exports = mongoose.model("Job", jobSchema);
