import React, { useState } from 'react';
import { useRequest } from 'ahooks';

import ChartCard from '@/components/Card/ChartCard';
import PictureImage from '@/static/img/picture.svg';
import PictureFailedImage from '@/static/img/picture-failed.svg';
import * as Services from '@/services';
import * as CONST from '@/constants';
import styles from './index.module.scss';

export interface EstimateProps {
  secid: string;
}
const Estimate: React.FC<EstimateProps> = ({ secid }) => {
  const [estimate, setEstimate] = useState<string | undefined>('');
  const { run: runGetPicTrendFromEastmoney } = useRequest(() => Services.Stock.GetPicTrendFromEastmoney(secid), {
    pollingInterval: CONST.DEFAULT.ESTIMATE_FUND_DELAY,
    onSuccess: setEstimate,
    refreshDeps: [secid],
  });

  return (
    <ChartCard onFresh={runGetPicTrendFromEastmoney}>
      <div className={styles.estimate}>
        {estimate === '' ? (
          <PictureImage />
        ) : estimate === undefined ? (
          <PictureFailedImage />
        ) : (
          <img src={estimate} onError={() => setEstimate(undefined)} />
        )}
      </div>
    </ChartCard>
  );
};

export default Estimate;
