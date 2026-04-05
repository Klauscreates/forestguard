export const documentedSupplyChainLinks = [
  {
    id: "link-apa-limeira-marfrig",
    owner: "Adriano Jose de Mattos",
    propertyName: "Fazenda Limeira",
    municipality: "Sao Felix do Xingu",
    protectedArea: "APA Triunfo do Xingu",
    linkedBuyers: ["Marfrig", "Frigol"],
    scope: "Protected-area monitoring zone",
    confidenceLabel: "Documented historical buyer link",
    matchingPrecision: "Zone-level documented case; no public ranch polygon loaded",
    evidenceSummary:
      "Repórter Brasil reported that after Ibama identified cattle grazing in an illegally cleared embargoed area inside the APA, Marfrig received cattle registered from Fazenda Limeira in Tucuma and Frigol also purchased cattle from the producer in 2019.",
    sourceTitle: "JBS, Marfrig e Frigol compram gado de desmatadores em area campea de focos de incendio na Amazonia",
    sourceUrl:
      "https://reporterbrasil.org.br/2019/08/jbs-marfrig-e-frigol-compram-gado-de-desmatadores-em-area-campea-de-focos-de-incendio-na-amazonia/",
    sourcePublishedAt: "2019-08-31",
  },
  {
    id: "link-apa-cunha-jbs",
    owner: "Jose Ronan Martins da Cunha",
    propertyName: "Fazenda Barro Branco",
    municipality: "Sao Felix do Xingu",
    protectedArea: "APA Triunfo do Xingu",
    linkedBuyers: ["JBS"],
    scope: "Protected-area monitoring zone",
    confidenceLabel: "Documented historical buyer link",
    matchingPrecision: "Zone-level documented case; no public ranch polygon loaded",
    evidenceSummary:
      "Repórter Brasil reported that a producer fined by Ibama for clearing inside APA Triunfo do Xingu sold cattle that JBS acquired through its Tucuma unit, with the animals registered as originating from Fazenda Barro Branco.",
    sourceTitle: "JBS, Marfrig e Frigol compram gado de desmatadores em area campea de focos de incendio na Amazonia",
    sourceUrl:
      "https://reporterbrasil.org.br/2019/08/jbs-marfrig-e-frigol-compram-gado-de-desmatadores-em-area-campea-de-focos-de-incendio-na-amazonia/",
    sourcePublishedAt: "2019-08-31",
  },
];

export function findDocumentedSupplyChainLinks({ protectedAreaOverlap, municipality }) {
  if (!municipality) return [];

  return documentedSupplyChainLinks.filter((entry) => {
    if (entry.municipality !== municipality) return false;
    if (protectedAreaOverlap && entry.protectedArea !== "APA Triunfo do Xingu") return false;
    return true;
  });
}
