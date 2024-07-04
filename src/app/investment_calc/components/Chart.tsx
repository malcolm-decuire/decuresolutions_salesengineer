'use client';
import React from "react";
import Highcharts from "highcharts/highstock";
import drilldow from "highcharts/modules/drilldown";
import PieChart from "highcharts-react-official";
// @ts-ignore
import patternFill from "highcharts-pattern-fill";

drilldow(Highcharts);

patternFill(Highcharts);

const colors = ['#ec6e30', '#37a9d6', '#27505e', '#ecae2e', '#8dc23f'];

const createPatterns = (arr: string[]) => arr.map((stroke, index) => ({
  id: `custom-pattern-${index}`,
  path: {
    d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
    // @ts-ignore
    stroke,
    fill: '#fff',
    strokeWidth: 3
  }
}))

interface ISeries {
  name: string;
  y: number;
}

const createOptions = (data: ISeries[]) => ({
  colors,
  defs: {
    patterns: createPatterns(colors)
  },
  chart: {
      type: 'pie',
      backgroundColor: 'transparent',
  },
  accessibility: {
      point: {
          valueSuffix: '%'
      }
  },
  title: {
      text: ''
  },
  subtitle: {
      text: ''
  },
  plotOptions: {
      pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
              enabled: false,
          },
          showInLegend: true,
          borderWidth: 3
      }
  },
  legend: {
    labelFormatter: function (this: ISeries) {
      const { name, y } = this;
      return `${name}: ${(y * 100).toFixed(2)}%`;
    }
  },
  series: [{
      name: 'Registrations',
      colorByPoint: true,
      innerSize: '50%',
      data: data.map((item, index) => ({
        name: item.name,
        y: item.y,
        color: `url(#custom-pattern-${index})`
      }))
  }],
  credits: {
    enabled: false
  }
})

interface IChartProps {
  data: ISeries[];
}

const Chart = ({ data }: IChartProps) => {
  const options = createOptions(data);

  return (
    <PieChart highcharts={Highcharts} options={options} />
  )
};

export default Chart
