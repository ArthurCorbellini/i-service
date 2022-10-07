// ------------------------------------------------------------------------------------------------------
// -------------------------------------- OBJETIVO: evitar a criação de um bloco try-catch em cada método
// EXPLICAÇÃO:
// -> catchAsync recebe a função assíncrona;
// -> essa função vai retornar uma nova função anônima que vai ser atribuída, por exemplo, ao createTour;
//     -> ou seja, essa nova função anônima é quem será chamada assim que um novo tour for criado;
//     -> é por isso que ela possui a mesma assinatura (req, res, next);
// -> posteriormente, essa função anônima vai chamar a função que foi passada inicialmente, executando
//    todo o código que está lá;
// -> por se tratar de uma função assíncrona, ela retornará uma Promisse;
// -> portanto, caso haja algum erro nessa Promisse (rejeitada), ele é pego com o .catch() da promessa;
// -> esse .catch(err => next(err)) (ou simplesmente .catch(next)) vai passar o erro pra próxima função;
// -> como como o .next(err) recebeu um parâmetro, então ele automaticamente cai no "globalErrorHandler"
// -> código alterativo, faz a mesma coisa:
// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(err => next(err));
//   };
// };

module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
