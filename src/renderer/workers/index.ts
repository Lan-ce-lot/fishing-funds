import PromiseWorker from 'promise-worker';
//TODO:redux 异步action 会导致逻辑问题，暂时停止使用worker方案
import SearchWorker from '@/workers/search.worker.ts';

export class BasicWorker extends PromiseWorker {
  private worker: Worker;

  constructor(worker: Worker) {
    super(worker);
    this.worker = worker;
  }

  terminate() {
    this.worker.terminate();
  }
}

export class SearchPromiseWorker extends BasicWorker {
  constructor() {
    super(new SearchWorker());
  }
}
