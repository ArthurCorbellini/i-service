class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // { ...this.queryString } clona o objeto e remove as "palavras reservadas" (futuramente serão usadas)
    const queryObj = { ...this.queryString };
    ["page", "sort", "limit", "fields"].forEach((el) => delete queryObj[el]);

    // 1) Filtros avançados
    // GET /api/v1/tours?duration[gte]=5&difficulty=easy
    // -> o sinal ? indica a inclusão WHERE;
    // -> o sinal & indica a inclusão AND;
    // -> "[gte]" indica "greater than or equal to";
    // passando a url acima, a "queryObj" vai trazer o seguinte:
    // -> { difficulty: 'easy', duration: { 'gte': '5' } }
    // -> o código abaixo coloca os operadores no padrão do mongodb, com um $ na frente:
    // -> { difficulty: 'easy', duration: { '$gte': '5' } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // crescente
    // -> GET /api/v1/tours?sort=price
    // decrescente
    // -> GET /api/v1/tours?sort=-price
    if (this.queryString.sort) {
      // caso o sorting vier com mais de um parâmetro:
      // -> GET /api/v1/tours?sort=-price,-ratingsAverage
      // -> troca a vírgula por um espaço, equivalente ao padrão do mongodb: .sort('-price -ratingsAverage')
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // default sort
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    // GET /api/v1/tours?fields=name,duration,difficulty
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // envia todos os campos do document, menos o "__v", que apenas é utilizado pelo mongoose
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
