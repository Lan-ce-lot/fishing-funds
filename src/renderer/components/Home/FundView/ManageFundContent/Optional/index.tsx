import React, { useMemo } from 'react';
import { ReactSortable } from 'react-sortablejs';
import clsx from 'clsx';
import { Button } from 'antd';

import PureCard from '@/components/Card/PureCard';
import AddIcon from '@/static/icon/add.svg';
import MenuIcon from '@/static/icon/menu.svg';
import RemoveIcon from '@/static/icon/remove.svg';
import EditIcon from '@/static/icon/edit.svg';
import CopyIcon from '@/static/icon/copy.svg';
import BellsLineIcon from '@/static/icon/bells-line.svg';
import BellsFillIcon from '@/static/icon/bells-fill.svg';
import CustomDrawer from '@/components/CustomDrawer';
import Empty from '@/components/Empty';
import { deleteFundAction, setFundConfigAction, updateFundAction } from '@/store/features/fund';
import { useSyncFixFundSetting, useDrawer, useAutoDestroySortableRef, useAppDispatch, useAppSelector } from '@/utils/hooks';
import * as Utils from '@/utils';
import styles from './index.module.scss';

const AddFundContent = React.lazy(() => import('@/components/Home/FundView/AddFundContent'));
const EditFundContent = React.lazy(() => import('@/components/Home/FundView/EditFundContent'));

export interface OptionalProps {}

const { dialog, clipboard } = window.contextModules.electron;

const Optional: React.FC<OptionalProps> = () => {
  const dispatch = useAppDispatch();
  const sortableRef = useAutoDestroySortableRef();
  const { show: showAddDrawer, set: setAddDrawer, close: closeAddDrawer } = useDrawer(null);
  const currentWalletCode = useAppSelector((state) => state.wallet.currentWalletCode);
  const fundConfig = useAppSelector((state) => state.wallet.fundConfig);
  const codeMap = useAppSelector((state) => state.wallet.fundConfigCodeMap);

  const {
    data: editData,
    show: showEditDrawer,
    set: setEditDrawer,
    close: closeEditDrawer,
  } = useDrawer({
    focus: '',
    fundData: {
      cyfe: 0,
      code: '',
      name: '',
      cbj: undefined as number | undefined,
      zdfRange: undefined as number | undefined,
      memo: '' as string | undefined,
    },
  });

  const sortFundConfig = useMemo(() => fundConfig.map((_) => ({ ..._, id: _.code })), [fundConfig]);

  const { done: syncFundSettingDone } = useSyncFixFundSetting();

  function onSortFundConfig(sortList: Fund.SettingItem[]) {
    // 判断顺序是否发生变化
    const hasChanged = Utils.CheckListOrderHasChanged(fundConfig, sortList, 'code');
    if (hasChanged) {
      const sortConfig = sortList.map((item) => {
        const fund = codeMap[item.code];
        return fund;
      });
      dispatch(setFundConfigAction({ config: sortConfig, walletCode: currentWalletCode }));
    }
  }

  async function onRemoveFund(fund: Fund.SettingItem) {
    const { response } = await dialog.showMessageBox({
      title: '删除基金',
      type: 'info',
      message: `确认删除 ${fund.name || ''} ${fund.code}`,
      buttons: ['确定', '取消'],
    });
    if (response === 0) {
      dispatch(deleteFundAction(fund.code));
    }
  }

  function onCopyFund(fund: Fund.SettingItem) {
    try {
      clipboard.writeText(JSON.stringify([fund]));
      dialog.showMessageBox({
        title: `复制成功`,
        type: 'info',
        message: `已复制 ${fund.name} 配置到粘贴板`,
      });
    } catch (error) {
      dialog.showMessageBox({
        type: 'info',
        title: `复制失败`,
        message: `基金JSON复制失败`,
      });
    }
  }

  async function onCancleRiskNotice(fund: Fund.SettingItem) {
    const { response } = await dialog.showMessageBox({
      title: '取消涨跌通知',
      type: 'info',
      message: `确认取消 ${fund.name || ''} 涨跌范围、基金净值通知`,
      buttons: ['确定', '取消'],
    });
    if (response === 0) {
      dispatch(
        updateFundAction({
          code: fund.code,
          zdfRange: undefined,
          jzNotice: undefined,
        })
      );
    }
  }

  return (
    <div className={styles.content}>
      {sortFundConfig.length ? (
        syncFundSettingDone ? (
          <ReactSortable
            ref={sortableRef}
            animation={200}
            delay={2}
            list={sortFundConfig}
            setList={onSortFundConfig}
            dragClass={styles.dragItem}
            swap
          >
            {sortFundConfig.map((fund) => {
              return (
                <PureCard key={fund.code} className={clsx(styles.row, 'hoverable')}>
                  <RemoveIcon className={styles.remove} onClick={() => onRemoveFund(fund)} />
                  <div className={styles.inner}>
                    <div className={styles.name}>
                      {fund.name}
                      <span className={styles.code}>（{fund.code}）</span>
                    </div>
                  </div>
                  <EditIcon
                    className={styles.function}
                    onClick={() =>
                      setEditDrawer({
                        fundData: {
                          name: fund.name,
                          cyfe: fund.cyfe,
                          code: fund.code,
                          cbj: fund.cbj,
                          zdfRange: fund.zdfRange,
                          memo: fund.memo,
                        },
                        focus: '',
                      })
                    }
                  />
                  {fund.zdfRange || fund.jzNotice ? (
                    <BellsFillIcon className={styles.function} onClick={() => onCancleRiskNotice(fund)} />
                  ) : (
                    <BellsLineIcon
                      className={styles.function}
                      onClick={() =>
                        setEditDrawer({
                          fundData: {
                            name: fund.name,
                            cyfe: fund.cyfe,
                            code: fund.code,
                            cbj: fund.cbj,
                            zdfRange: fund.zdfRange,
                            memo: fund.memo,
                          },
                          focus: 'zdfRange',
                        })
                      }
                    />
                  )}
                  <CopyIcon className={styles.function} onClick={() => onCopyFund(fund)} />
                  <MenuIcon className={styles.menu} />
                </PureCard>
              );
            })}
          </ReactSortable>
        ) : (
          <Empty text="正在同步基金设置~" />
        )
      ) : (
        <Empty text="暂未自选基金~" />
      )}
      <Button
        className="bottom-button"
        shape="circle"
        type="primary"
        size="large"
        icon={<AddIcon />}
        onClick={(e) => {
          setAddDrawer(null);
          e.stopPropagation();
        }}
      />
      <CustomDrawer show={showAddDrawer}>
        <AddFundContent onClose={closeAddDrawer} onEnter={closeAddDrawer} />
      </CustomDrawer>
      <CustomDrawer show={showEditDrawer}>
        <EditFundContent onClose={closeEditDrawer} onEnter={closeEditDrawer} fund={editData.fundData} focus={editData.focus} />
      </CustomDrawer>
    </div>
  );
};

export default Optional;
