import * as cheerio from "cheerio";
import path from "path";
import { readFileSync } from "fs";
import chalk from "chalk";

// Map para armazenar páginas visitadas (já indexadas)
const visitedPages = new Map();

const crowledPages = new Map();

// limpa a url para ficar apenas o nome da página. Ex.: "mochileiro.html"
const cleanUrl = (url) => {
  return path.basename(url);
};

// Ranqueando a página
// 4. a) pega uma pagina inicial para aplicar indexação
const crawlPage = async (url, originUrl = url) => {
  const cleanedUrl = cleanUrl(url);

  // Verifica se a página já foi visitada
  if (visitedPages.has(cleanedUrl)) {
    return;
  }

  // Marca a página como visitada
  visitedPages.set(cleanedUrl, { visites: true, autoridade: 0 });

  try {
    // Indexa o conteúdo da página atual
    const autoridade = indexPage(url, originUrl);
    visitedPages.get(cleanUrl(originUrl)).autoridade = autoridade;

    // 4. b) Verifica os links, armazenando em uma estrutura de dados (lista)
    const links = extractLinks(url);
    console.log("\n> Links: ", links, "\n");

    // 4. c) Para cada link, baixa a página referenciada recursivamente
    for (const link of links) {
      if (!visitedPages.has(cleanUrl(link))) {
        await crawlPage(`./páginas/${link}`, originUrl);
      }
    }
  } catch (err) {
    console.error(`Erro ao rastrear ${url}: ${err}`);
  }
};

//! Extrai os links de uma página e retorna eles
const extractLinks = (url) => {
  const htmlContent = readFileSync(url, "utf8"); // Certifique-se de especificar o encoding como "utf8"
  // Carrega o conteúdo HTML no Cheerio
  const $ = cheerio.load(htmlContent);

  const links = [];

  // Seleciona todos os elementos <a> e extrai os links
  $("a").each(function () {
    const href = $(this).attr("href");
    links.push(href);
  });

  return links;
};

// Função para indexar a pagina
// É AQUI QUE COLOCAREMOS AS FUNÇÕES PARA CALCULAR OS PONTOS
let pontuacao = 0;
const indexPage = (url, originUrl) => {
  // só printando os links para testar se está funcionando
  const htmlContent = readFileSync(url, "utf8");
  const $ = cheerio.load(htmlContent);

  $("a").each(function () {
    const href = $(this).attr("href");

    // Autoridade da Página
    if (href == originUrl) {
      pontuacao = defineAutority(pontuacao, href, originUrl);
    }

    if (visitedPages.has(href)) {
      console.log(href + chalk.blue(" => indexada"));
    } else {
      console.log(href + chalk.red(" => não indexada"));
    }
  });
  return pontuacao;
};

// 2-a) Definindo a autoridade da Página
// determinado pela quantidade de links recebidos de outras páginas
const defineAutority = (score, url, urlOrigin) => {
  if (url == urlOrigin) {
    score += 10;
    return score;
  }
  return;
};

// Home do buscador
const homeBuscador = async () => {
  const uniques = {};

  const pages = [
    "blade_runner.html",
    "duna.html",
    "interestelar.html",
    "matrix.html",
    "mochileiro.html",
  ];

  for (let i = 0; i < pages.length; i++) {
    visitedPages.clear();
    pontuacao = 0;
    await crawlPage(`./páginas/${pages[i]}`, pages[i]);
    for (let [key, value] of visitedPages.entries()) {
      if (value.autoridade !== 0) {
        uniques[key] = value;
        visitedPages.delete(key); // Remove o elemento do visitedPages
      }
    }
  }
  return uniques;
};

(async () => {
  const x = await homeBuscador();
  console.log("x: ", x);
})();
