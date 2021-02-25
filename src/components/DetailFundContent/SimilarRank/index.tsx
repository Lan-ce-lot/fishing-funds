import React, { useEffect, useRef, useState } from 'react';
import { useSize } from 'ahooks';
import * as echarts from 'echarts';

import { useNativeThemeColor } from '@/utils/hooks';
import CONST_VARIBLES from '@/constants/varibles.json';

import styles from './index.scss';

interface SimilarRankProps {
  rateInSimilarType?: { x: number; y: number; sc: string }[];
}

const SimilarRank: React.FC<SimilarRankProps> = ({
  rateInSimilarType = [],
}) => {
  const similarRef = useRef<HTMLDivElement>(null);
  const [
    similarRankChartInstance,
    setSimilarRankChartInstance,
  ] = useState<echarts.ECharts | null>(null);
  const { width: similarRefWidth } = useSize(similarRef);
  const { colors: varibleColors, darkMode } = useNativeThemeColor(
    CONST_VARIBLES
  );

  const initSimilarRankChart = () => {
    const instance = echarts.init(similarRef.current!);
    setSimilarRankChartInstance(instance);
  };

  const renderSimilarRankChart = () => {
    similarRankChartInstance?.setOption({
      title: {
        text: '同类中排名',
        left: 'center',
        top: 0,
        textStyle: {
          color: varibleColors['--main-text-color'],
          fontSize: 12,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // 坐标轴指示器，坐标轴触发有效
          type: 'shadow', // 默认为直线，可选为：'line' | 'shadow'
        },
      },
      grid: {
        top: 32,
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        nameTextStyle: {
          color: varibleColors['--main-text-color'],
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: rateInSimilarType?.map(({ x, y, sc }) => [x, y]),
          type: 'bar',
        },
      ],
      dataZoom: [
        {
          type: 'inside',
        },
      ],
    });
  };

  useEffect(() => {
    initSimilarRankChart();
  }, []);

  useEffect(() => {
    if (similarRankChartInstance) {
      renderSimilarRankChart();
    }
  }, [darkMode, similarRankChartInstance, rateInSimilarType]);

  useEffect(() => {
    similarRankChartInstance?.resize({
      height: similarRefWidth! * 0.64,
    });
  }, [similarRefWidth]);

  return (
    <div className={styles.content}>
      <div ref={similarRef} style={{ width: '100%' }}></div>
    </div>
  );
};

export default SimilarRank;
