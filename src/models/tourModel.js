const mongoose = require("mongoose");
const slugify = require("slugify");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name required!"],
      unique: true,
      trim: true,
      maxlength: [40, "Name less or equal than 40 characteres"],
      minlength: [10, "Name more or equal than 10 characteres"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "Duration required!"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "MaxGroupSize required!"],
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty required!"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium ou difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "RatingsAverage must be above 1.0"],
      max: [5, "RatingsAverage must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price required!"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // "this" só aponta para a inserção de novos documentos.
          // logo, em updates, essa functon não vai funcionar
          return val < this.price;
        },
        message: "PriceDiscount ({VALUE}) must be less than the price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "Summary required!"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "ImageCover required!"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // nunca retorna essa variável no select
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toOject: { virtuals: true },
  }
);

// exemplo de uma "virtual property":
// -> não é salvo no banco;
// -> parâmetro criado ao tentar recuperar o document, e devolvido no response junto com os demais;
// -> não é possível utiliza-la em uma query, porque ela não é salva no banco.
schema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// ----------------------------------------------
// ---------- Middlewares do Moongose (ou hooks):
// ----------------------------------------------
// Document middleware: roda ANTES do .save() e do .create();
schema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Document middleware: roda DEPOIS do .save() e do .create(), e traz o doc salvo também;
// schema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query middleware: roda ANTES de qualquer método que começa com .find...
// -> .find(); .findOne(); .findAndDelete()...;
// -> /^find/ é uma expressão regular, dizendo pra considerar só os que começam com find
schema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Query middleware: roda DEPOIS de qualquer método que começa com .find...
schema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  next();
});

// Aggregation middleware: roda ANTES de qualquer pipeline de agregação, nos controllers
schema.pre("aggregate", function (next) {
  // adiciona um $match no início do pipeline de agregação.
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model("Tour", schema);
