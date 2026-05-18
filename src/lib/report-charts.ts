import { createCanvas } from "canvas";
import { Chart, registerables, type ChartConfiguration, type ChartItem } from "chart.js";

Chart.register(...registerables);

export async function renderRadarChart(
  labels: string[],
  values: number[],
  width = 320,
  height = 320
) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);

  const configuration: ChartConfiguration<"radar", number[], string> = {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Puntaje",
          data: values,
          backgroundColor: "rgba(34,139,34,0.2)",
          borderColor: "rgba(34,139,34,1)",
          pointBackgroundColor: "rgba(34,139,34,1)",
        },
      ],
    },
    options: {
      aspectRatio: 1,
      layout: {
        padding: 12,
      },
      scales: {
        r: {
          beginAtZero: true,
          suggestedMin: 0,
          suggestedMax: Math.max(5, Math.max(...values)),
          ticks: { display: false }, // ocultar números de escala (1-5)
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  };

  const chart = new Chart(canvas as unknown as ChartItem, configuration);

  try {
    return canvas.toBuffer("image/png");
  } finally {
    chart.destroy();
  }
}
