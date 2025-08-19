(() => {
  const LKEY_STATE = "team_state_v3";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function slugify(str) {
    return String(str)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(LKEY_STATE) || "{}");
    } catch {
      return {};
    }
  }
  function saveState(state) {
    localStorage.setItem(LKEY_STATE, JSON.stringify(state));
  }

  function ensureTeamState(state, team) {
    if (!state[team.code]) state[team.code] = { score: 250 };
    state[team.code].score = clamp(
      Number(state[team.code].score) || 250,
      1,
      9999
    );
    team.state = state[team.code];
  }

  function normalizeSelecoes(raw) {
    return (raw || []).map((s) => {
      const name = s.Team;
      return {
        code: slugify(name),
        name,
        flag: s.Path,
        tournament: s.Tournament,
      };
    }).filter((s) => s.code && s.name);
  }

  // JSON embutido
  const rawSelecoes = [
    {
      Tournament: "AFC",
      Team: "Afeganistão",
      Path: "Flags/Afeganistão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "África do Sul",
      Path: "Flags/África do Sul.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Albânia",
      Path: "Flags/Albânia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Alemanha",
      Path: "Flags/Alemanha.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Andorra",
      Path: "Flags/Andorra.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Angola",
      Path: "Flags/Angola.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Anguila",
      Path: "Flags/Anguila.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Antígua e Barbuda",
      Path: "Flags/Antígua e Barbuda.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Arábia Saudita",
      Path: "Flags/Arábia Saudita.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Argélia",
      Path: "Flags/Argélia.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Argentina",
      Path: "Flags/Argentina.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Armênia",
      Path: "Flags/Armênia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Aruba",
      Path: "Flags/Aruba.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Austrália",
      Path: "Flags/Austrália.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Áustria",
      Path: "Flags/Áustria.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Azerbaijão",
      Path: "Flags/Azerbaijão.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Bahamas",
      Path: "Flags/Bahamas.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Bahrein",
      Path: "Flags/Bahrein.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Bangladesh",
      Path: "Flags/Bangladesh.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Barbados",
      Path: "Flags/Barbados.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Bélgica",
      Path: "Flags/Bélgica.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Belize",
      Path: "Flags/Belize.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Benim",
      Path: "Flags/Benim.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Bermudas",
      Path: "Flags/Bermudas.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Bielorrússia",
      Path: "Flags/Bielorrússia.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Bolívia",
      Path: "Flags/Bolívia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Bonaire",
      Path: "Flags/Bonaire.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Bósnia e Herzegovina",
      Path: "Flags/Bósnia e Herzegovina.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Botswana",
      Path: "Flags/Botswana.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Brasil",
      Path: "Flags/Brasil.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Brunei",
      Path: "Flags/Brunei.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Bulgária",
      Path: "Flags/Bulgária.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Burkina Faso",
      Path: "Flags/Burkina Faso.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Burundi",
      Path: "Flags/Burundi.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Butão",
      Path: "Flags/Butão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Cabo Verde",
      Path: "Flags/Cabo Verde.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Camarões",
      Path: "Flags/Camarões.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Camboja",
      Path: "Flags/Camboja.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Canadá",
      Path: "Flags/Canadá.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Catar",
      Path: "Flags/Catar.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Cazaquistão",
      Path: "Flags/Cazaquistão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Chade",
      Path: "Flags/Chade.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Chile",
      Path: "Flags/Chile.jpg",
    },
    {
      Tournament: "AFC",
      Team: "China",
      Path: "Flags/China.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Chipre",
      Path: "Flags/Chipre.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Colômbia",
      Path: "Flags/Colômbia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Comores",
      Path: "Flags/Comores.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Coreia do Norte",
      Path: "Flags/Coreia do Norte.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Coreia do Sul",
      Path: "Flags/Coreia do Sul.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Costa do Marfim",
      Path: "Flags/Costa do Marfim.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Costa Rica",
      Path: "Flags/Costa Rica.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Croácia",
      Path: "Flags/Croácia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Cuba",
      Path: "Flags/Cuba.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Curaçao",
      Path: "Flags/Curaçao.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Dinamarca",
      Path: "Flags/Dinamarca.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Djibouti",
      Path: "Flags/Djibouti.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Dominica",
      Path: "Flags/Dominica.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Egito",
      Path: "Flags/Egito.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "El Salvador",
      Path: "Flags/El Salvador.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Emirados Árabes Unidos",
      Path: "Flags/Emirados Árabes Unidos.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Equador",
      Path: "Flags/Equador.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Eritreia",
      Path: "Flags/Eritreia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Escócia",
      Path: "Flags/Escócia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Eslováquia",
      Path: "Flags/Eslováquia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Eslovênia",
      Path: "Flags/Eslovênia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Espanha",
      Path: "Flags/Espanha.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Essuatíni",
      Path: "Flags/Essuatíni.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Estados Unidos",
      Path: "Flags/Estados Unidos.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Estônia",
      Path: "Flags/Estônia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Etiópia",
      Path: "Flags/Etiópia.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Fiji",
      Path: "Flags/Fiji.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Filipinas",
      Path: "Flags/Filipinas.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Finlândia",
      Path: "Flags/Finlândia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "França",
      Path: "Flags/França.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Gabão",
      Path: "Flags/Gabão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Gâmbia",
      Path: "Flags/Gâmbia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Gana",
      Path: "Flags/Gana.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Geórgia",
      Path: "Flags/Geórgia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Gibraltar",
      Path: "Flags/Gibraltar.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Granada",
      Path: "Flags/Granada.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Grécia",
      Path: "Flags/Grécia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Guadalupe",
      Path: "Flags/Guadalupe.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Guam",
      Path: "Flags/Guam.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Guatemala",
      Path: "Flags/Guatemala.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Guiana",
      Path: "Flags/Guiana.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Guiana Francesa",
      Path: "Flags/Guiana Francesa.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Guiné",
      Path: "Flags/Guiné.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Guiné Equatorial",
      Path: "Flags/Guiné Equatorial.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Guiné-Bissau",
      Path: "Flags/Guiné-Bissau.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Haiti",
      Path: "Flags/Haiti.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Holanda",
      Path: "Flags/Holanda.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Honduras",
      Path: "Flags/Honduras.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Hong Kong",
      Path: "Flags/Hong Kong.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Hungria",
      Path: "Flags/Hungria.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Iémen",
      Path: "Flags/Iémen.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Ilhas Cayman",
      Path: "Flags/Ilhas Cayman.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Ilhas Cook",
      Path: "Flags/Ilhas Cook.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Ilhas Faroé",
      Path: "Flags/Ilhas Faroé.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Ilhas Salomão",
      Path: "Flags/Ilhas Salomão.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Ilhas Turcas e Caicos",
      Path: "Flags/Ilhas Turcas e Caicos.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Ilhas Virgens Americanas",
      Path: "Flags/Ilhas Virgens Americanas.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Ilhas Virgens Britânicas",
      Path: "Flags/Ilhas Virgens Britânicas.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Índia",
      Path: "Flags/Índia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Indonésia",
      Path: "Flags/Indonésia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Inglaterra",
      Path: "Flags/Inglaterra.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Irã",
      Path: "Flags/Irã.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Iraque",
      Path: "Flags/Iraque.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Irlanda",
      Path: "Flags/Irlanda.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Irlanda do Norte",
      Path: "Flags/Irlanda do Norte.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Islândia",
      Path: "Flags/Islândia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Israel",
      Path: "Flags/Israel.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Itália",
      Path: "Flags/Itália.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Jamaica",
      Path: "Flags/Jamaica.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Japão",
      Path: "Flags/Japão.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Jordânia",
      Path: "Flags/Jordânia.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Kiribati",
      Path: "Flags/Kiribati.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Kosovo",
      Path: "Flags/Kosovo.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Kuwait",
      Path: "Flags/Kuwait.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Laos",
      Path: "Flags/Laos.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Lesoto",
      Path: "Flags/Lesoto.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Letônia",
      Path: "Flags/Letônia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Líbano",
      Path: "Flags/Líbano.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Libéria",
      Path: "Flags/Libéria.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Líbia",
      Path: "Flags/Líbia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Liechtenstein",
      Path: "Flags/Liechtenstein.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Lituânia",
      Path: "Flags/Lituânia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Luxemburgo",
      Path: "Flags/Luxemburgo.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Macau",
      Path: "Flags/Macau.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Macedônia do Norte",
      Path: "Flags/Macedônia do Norte.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Madagascar",
      Path: "Flags/Madagascar.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Malásia",
      Path: "Flags/Malásia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Malawi",
      Path: "Flags/Malawi.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Maldivas",
      Path: "Flags/Maldivas.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Mali",
      Path: "Flags/Mali.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Malta",
      Path: "Flags/Malta.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Marianas Setentrionais",
      Path: "Flags/Marianas Setentrionais.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Marrocos",
      Path: "Flags/Marrocos.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Martinica",
      Path: "Flags/Martinica.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Maurício",
      Path: "Flags/Maurício.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Mauritânia",
      Path: "Flags/Mauritânia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "México",
      Path: "Flags/México.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Mianmar",
      Path: "Flags/Mianmar.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Moçambique",
      Path: "Flags/Moçambique.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Moldávia",
      Path: "Flags/Moldávia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Mongólia",
      Path: "Flags/Mongólia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Monserrate",
      Path: "Flags/Monserrate.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Montenegro",
      Path: "Flags/Montenegro.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Namíbia",
      Path: "Flags/Namíbia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Nepal",
      Path: "Flags/Nepal.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Nicarágua",
      Path: "Flags/Nicarágua.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Níger",
      Path: "Flags/Níger.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Nigéria",
      Path: "Flags/Nigéria.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Noruega",
      Path: "Flags/Noruega.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Nova Caledônia",
      Path: "Flags/Nova Caledônia.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Nova Zelândia",
      Path: "Flags/Nova Zelândia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Omã",
      Path: "Flags/Omã.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "País de Gales",
      Path: "Flags/País de Gales.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Palestina",
      Path: "Flags/Palestina.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Panamá",
      Path: "Flags/Panamá.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Papua Nova Guiné",
      Path: "Flags/Papua Nova Guiné.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Paquistão",
      Path: "Flags/Paquistão.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Paraguai",
      Path: "Flags/Paraguai.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Peru",
      Path: "Flags/Peru.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Polônia",
      Path: "Flags/Polônia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Porto Rico",
      Path: "Flags/Porto Rico.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Portugal",
      Path: "Flags/Portugal.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Quênia",
      Path: "Flags/Quênia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Quirguistão",
      Path: "Flags/Quirguistão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "República Centro-Africana",
      Path: "Flags/República Centro-Africana.jpg",
    },
    {
      Tournament: "CAF",
      Team: "República Democrática do Congo",
      Path: "Flags/República Democrática do Congo.jpg",
    },
    {
      Tournament: "CAF",
      Team: "República do Congo",
      Path: "Flags/República do Congo.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "República Dominicana",
      Path: "Flags/República Dominicana.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "República Tcheca",
      Path: "Flags/República Tcheca.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Reunião",
      Path: "Flags/Reunião.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Romênia",
      Path: "Flags/Romênia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Ruanda",
      Path: "Flags/Ruanda.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Rússia",
      Path: "Flags/Rússia.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Samoa",
      Path: "Flags/Samoa.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Samoa Americana",
      Path: "Flags/Samoa Americana.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "San Marino",
      Path: "Flags/San Marino.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Santa Lúcia",
      Path: "Flags/Santa Lúcia.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "São Cristovão e Neves",
      Path: "Flags/São Cristovão e Neves.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "São Martinho Francês",
      Path: "Flags/São Martinho Francês.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "São Martinho Holandes",
      Path: "Flags/São Martinho Holandes.jpg",
    },
    {
      Tournament: "CAF",
      Team: "São Tomé e Príncipe",
      Path: "Flags/São Tomé e Príncipe.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "São Vicente e Granadinas",
      Path: "Flags/São Vicente e Granadinas.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Senegal",
      Path: "Flags/Senegal.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Serra Leoa",
      Path: "Flags/Serra Leoa.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Sérvia",
      Path: "Flags/Sérvia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Seychelles",
      Path: "Flags/Seychelles.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Singapura",
      Path: "Flags/Singapura.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Síria",
      Path: "Flags/Síria.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Somália",
      Path: "Flags/Somália.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Sri Lanka",
      Path: "Flags/Sri Lanka.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Sudão",
      Path: "Flags/Sudão.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Sudão do Sul",
      Path: "Flags/Sudão do Sul.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Suécia",
      Path: "Flags/Suécia.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Suíça",
      Path: "Flags/Suíça.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Suriname",
      Path: "Flags/Suriname.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Tadjiquistão",
      Path: "Flags/Tadjiquistão.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Tahiti",
      Path: "Flags/Tahiti.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Tailândia",
      Path: "Flags/Tailândia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Taipé Chinês",
      Path: "Flags/Taipé Chinês.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Tanzânia",
      Path: "Flags/Tanzânia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Timor-Leste",
      Path: "Flags/Timor-Leste.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Togo",
      Path: "Flags/Togo.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Tonga",
      Path: "Flags/Tonga.jpg",
    },
    {
      Tournament: "CONCACAF",
      Team: "Trinidad e Tobago",
      Path: "Flags/Trinidad e Tobago.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Tunísia",
      Path: "Flags/Tunísia.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Turcomenistão",
      Path: "Flags/Turcomenistão.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Turquia",
      Path: "Flags/Turquia.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Tuvalu",
      Path: "Flags/Tuvalu.jpg",
    },
    {
      Tournament: "UEFA",
      Team: "Ucrânia",
      Path: "Flags/Ucrânia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Uganda",
      Path: "Flags/Uganda.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Uruguai",
      Path: "Flags/Uruguai.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Uzbequistão",
      Path: "Flags/Uzbequistão.jpg",
    },
    {
      Tournament: "OFC",
      Team: "Vanuatu",
      Path: "Flags/Vanuatu.jpg",
    },
    {
      Tournament: "CONMEBOL",
      Team: "Venezuela",
      Path: "Flags/Venezuela.jpg",
    },
    {
      Tournament: "AFC",
      Team: "Vietnã",
      Path: "Flags/Vietnã.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Zâmbia",
      Path: "Flags/Zâmbia.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Zanzibar",
      Path: "Flags/Zanzibar.jpg",
    },
    {
      Tournament: "CAF",
      Team: "Zimbábue",
      Path: "Flags/Zimbábue.jpg",
    },
  ];

  const selecoes = normalizeSelecoes(rawSelecoes);
  const state = loadState();
  selecoes.forEach(s => ensureTeamState(state, s));
  saveState(state);

  let sortKey = "name",
      sortDir = 1;

  const tbody = document.getElementById("sel-tbody");

  function composeRow(s) {
    return `<tr data-code="${s.code}">
      <td><img class="flag" src="${s.flag}" alt="${s.name}" onerror="this.style.visibility='hidden'"></td>
      <td>${s.name}</td>
      <td>${s.state.score}</td>
    </tr>`;
  }

  function renderTable() {
    const get = (s) =>
      sortKey === "name"
        ? s.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
        : s.state.score;

    tbody.innerHTML = [...selecoes]
      .sort((a, b) => {
        const A = get(a), B = get(b);
        if (A < B) return -1 * sortDir;
        if (A > B) return 1 * sortDir;
        return 0;
      })
      .map(composeRow)
      .join("");

    bindRowClick();
  }

  document.querySelectorAll("#sel-table thead th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (sortKey === key) sortDir *= -1;
      else {
        sortKey = key;
        sortDir = 1;
      }
      document.querySelectorAll("#sel-table thead th.sortable")
        .forEach(x => x.classList.remove("asc", "desc"));
      th.classList.add(sortDir === 1 ? "asc" : "desc");
      renderTable();
    });
  });

  function bindRowClick() {
    const rows = document.querySelectorAll('#sel-tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const code = row.getAttribute('data-code');
        const data = selecoes.find(s => s.code === code);
        if (!data) return;

        document.getElementById('box-name').textContent = data.name;
        document.getElementById('box-tournament').textContent = data.tournament;
        document.getElementById('box-score').textContent = data.state.score;
        const flagEl = document.getElementById('box-flag');
        flagEl.src = data.flag;
        flagEl.alt = data.name;
      });
    });
  }

  renderTable();

})();