import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { useInterval, useBoolean } from 'ahooks';
import { ipcRenderer, remote } from 'electron';
import { bindActionCreators } from 'redux';
import { useDispatch } from 'react-redux';

import { getSystemSetting } from '@/actions/setting';
import { getCurrentHours } from '@/actions/time';
import { updateAvaliable } from '@/actions/updater';
import { getFundConfig, getFunds, updateFund } from '@/actions/fund';
import * as Utils from '@/utils';
import * as CONST from '@/constants';
const { nativeTheme } = remote;

export function useWorkDayTimeToDo(
  todo: () => void,
  delay: number,
  config?: { immediate: boolean }
): void {
  useInterval(
    async () => {
      const timestamp = await getCurrentHours();
      const isWorkDayTime = Utils.JudgeWorkDayTime(Number(timestamp));
      if (isWorkDayTime) {
        todo();
      }
    },
    delay,
    config
  );
}

export function useFixTimeToDo(
  todo: () => void,
  delay: number,
  config?: { immediate: boolean }
): void {
  useInterval(
    async () => {
      const timestamp = await getCurrentHours();
      const isFixTime = Utils.JudgeFixTime(Number(timestamp));
      if (isFixTime) {
        todo();
      }
    },
    delay,
    config
  );
}

export function useScrollToTop(
  config: {
    before?: () => void;
    after?: () => void;
    option?: {
      behavior?: ScrollBehavior;
      left?: number;
      top?: number;
    };
  },
  dep: any[] = []
) {
  return useCallback(() => {
    const { before, after, option } = config;
    before && before();
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
      ...option,
    });
    after && after();
  }, dep);
}

export function useUpdater() {
  const dispatch = useDispatch();
  const { autoCheckUpdateSetting } = getSystemSetting();
  // 一个小时检查一次版本
  useInterval(
    () => autoCheckUpdateSetting && ipcRenderer.send('check-update'),
    1000 * 60 * 60 * 1,
    {
      immediate: true,
    }
  );
  useLayoutEffect(() => {
    ipcRenderer.on('update-available', (e, data) =>
      dispatch(updateAvaliable(data))
    );
    return () => {
      ipcRenderer.removeAllListeners('update-available');
    };
  }, []);
}

export function useNativeTheme() {
  const [darkMode, setDarkMode] = useState(nativeTheme.shouldUseDarkColors);
  useLayoutEffect(() => {
    const { systemThemeSetting } = getSystemSetting();
    const listener = ipcRenderer.on('nativeTheme-updated', (e, data) => {
      setDarkMode(data.darkMode);
    });
    Utils.UpdateSystemTheme(systemThemeSetting);
    return () => {
      listener.removeAllListeners('nativeTheme-updated');
    };
  }, []);
  return { darkMode };
}

export function useNativeThemeColor(varibles: string[]) {
  const { darkMode } = useNativeTheme();
  const memoColors = useMemo(() => Utils.getVariblesColor(varibles), [
    darkMode,
  ]);
  return { darkMode, colors: memoColors };
}

export function useEchartResize() {}

export function useActions(actions: any, deps?: any[]) {
  const dispatch = useDispatch();
  return useMemo(
    () => {
      if (Array.isArray(actions)) {
        return actions.map((a) => bindActionCreators(a, dispatch));
      }
      return bindActionCreators(actions, dispatch);
    },
    deps ? [dispatch, ...deps] : [dispatch]
  );
}

export function useSyncFixFundSetting() {
  const [done, { setTrue }] = useBoolean(false);

  async function FixFundSetting(fundConfig: Fund.SettingItem[]) {
    try {
      const responseFunds = await getFunds(fundConfig);
      responseFunds
        .filter((_) => !!_)
        .forEach((responseFund) => {
          updateFund({
            code: responseFund?.fundcode!,
            name: responseFund?.name,
          });
        });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const { fundConfig } = getFundConfig();
    const unNamedFunds = fundConfig.filter(({ name }) => !name);
    if (unNamedFunds.length) {
      FixFundSetting(unNamedFunds).finally(() => {
        setTrue();
      });
    } else {
      setTrue();
    }
  }, []);

  return { done };
}

export function useAdjustmentNotification() {
  const { adjustmentNotificationSetting } = getSystemSetting();
  useInterval(
    async () => {
      if (!adjustmentNotificationSetting) {
        return;
      }
      const timestamp = await getCurrentHours();
      const {
        isAdjustmentNotificationTime,
        now,
      } = Utils.JudgeAdjustmentNotificationTime(Number(timestamp));
      const month = now.get('month');
      const date = now.get('date');
      const hour = now.get('hour');
      const minute = now.get('minute');
      const currentDate = `${month}-${date}`;
      const lastNotificationDate = Utils.GetStorage(
        CONST.STORAGE.ADJUSTMENT_NOTIFICATION_DATE,
        ''
      );
      if (
        isAdjustmentNotificationTime &&
        currentDate !== lastNotificationDate
      ) {
        new Notification('调仓提醒', {
          body: `当前时间${hour}:${minute} 注意行情走势`,
        });
        Utils.SetStorage(
          CONST.STORAGE.ADJUSTMENT_NOTIFICATION_DATE,
          currentDate
        );
      }
    },
    1000 * 60 * 5,
    {
      immediate: true,
    }
  );
}
