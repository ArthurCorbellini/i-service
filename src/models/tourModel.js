const mongoose = require("mongoose");
const slugify = require("slugify");
const msg = require("../../languages/pt-BR.json");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "name")],
      unique: true,
      trim: true,
      maxlength: [
        40,
        msg["vld.maxlength"]
          .replace("{{field}}", "name")
          .replace("{{size}}", "40"),
      ],
      minlength: [
        10,
        msg["vld.minlength"]
          .replace("{{field}}", "name")
          .replace("{{size}}", "10"),
      ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, msg["vld.required"].replace("{{field}}", "duration")],
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        msg["vld.required"].replace("{{field}}", "maxGroupSize"),
      ],
    },
    difficulty: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "difficulty")],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: msg["vld.enumType"]
          .replace("{{field}}", "difficulty")
          .replace("{{values}}", "easy/medium/difficult"),
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [
        1,
        msg["vld.min"]
          .replace("{{field}}", "ratingsAverage")
          .replace("{{value}}", "1.0"),
      ],
      max: [
        5,
        msg["vld.max"]
          .replace("{{field}}", "ratingsAverage")
          .replace("{{value}}", "5.0"),
      ],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, msg["vld.required"].replace("{{field}}", "price")],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // "this" só aponta para a inserção de novos documentos.
          // logo, em updates, essa functon não vai funcionar
          return val < this.price;
        },
        message: msg["vld.tourPriceDiscount"],
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, msg["vld.required"].replace("{{field}}", "summary")],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "imageCover")],
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
  console.log(
    msg["warn.queryTime"].replace("{{time}}", Date.now() - this.start)
  );
  next();
});

// Aggregation middleware: roda ANTES de qualquer pipeline de agregação, nos controllers
schema.pre("aggregate", function (next) {
  // adiciona um $match no início do pipeline de agregação.
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model("Tour", schema);
