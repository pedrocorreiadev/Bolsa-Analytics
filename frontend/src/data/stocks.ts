export type StockPoint = {
  dia: string;
  preco: number;
};


export type Stock = {
  nome: string;
  dados: StockPoint[];
};

export const stocks: Record<string, Stock> = {
  PETR4: {
    nome: "Petrobras",
    dados: [
      { dia: "Seg", preco: 28.5 },
      { dia: "Ter", preco: 29.1 },
      { dia: "Qua", preco: 28.8 },
      { dia: "Qui", preco: 30.4 },
      { dia: "Sex", preco: 31.2 },
    ],
  },
  VALE3: {
    nome: "Vale",
    dados: [
      { dia: "Seg", preco: 61.2 },
      { dia: "Ter", preco: 60.5 },
      { dia: "Qua", preco: 62.1 },
      { dia: "Qui", preco: 63.4 },
      { dia: "Sex", preco: 62.8 },
    ],
  },
  ITUB4: {
    nome: "Itaú",
    dados: [
      { dia: "Seg", preco: 34.1 },
      { dia: "Ter", preco: 34.8 },
      { dia: "Qua", preco: 35.2 },
      { dia: "Qui", preco: 34.9 },
      { dia: "Sex", preco: 36.1 },
    ],
  },
};



export type Periodo = 7 | 30 | 90;

export function gerarHistorico(
  precoInicial: number,
  periodo: Periodo
): StockPoint[] {
  const dados: StockPoint[] = [];

  for (let i = 0; i < periodo; i++) {
    const data = new Date(2026, 9, 26);
    data.setDate(data.getDate() - (periodo - 1 - i));

    const oscilacao =
      Math.sin(i * 0.4) * 1.5 + i * 0.03;

    const preco = Number(
      (precoInicial + oscilacao).toFixed(2)
    );

    dados.push({
      dia: data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      preco,
    });
  }

  return dados;
}
