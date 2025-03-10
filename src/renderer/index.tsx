import { createRoot } from 'react-dom/client';
import NP from 'number-precision';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import * as echarts from 'echarts';
import chinaMap from '@/static/map/china.json';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Provider } from 'react-redux';
import store from '@/store';
import App from '@/App';
import 'electron-disable-file-drop';
import 'dayjs/locale/zh-cn';
import '@/utils/window';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('zh-cn');

echarts.registerMap('china', chinaMap as any);

NP.enableBoundaryChecking(false);

const { platform } = window.contextModules.process;

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN}>
    <style>
      {`:root{
        background-color: ${platform === 'darwin' ? 'initial' : 'var(--inner-color)'};
      }`}
    </style>
    <Provider store={store}>
      <App />
    </Provider>
  </ConfigProvider>
);
