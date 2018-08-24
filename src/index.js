// stratum+tcp://stratum.antpool.com
const net = require('net');
const extend = require('lodash/extend');
const connect = require('./connect');
const submitWork = require('./submitWork');
const onData = require('./onData');
const onError = require('./onError');
const validateConfig = require('./validateConfig');
const WorkObject = require('./workObject');

const defaultConfig = {
  "autoReconnectOnError": true
};

class Client {
  submit(text) {
    submitWork(this.client, { worker_name: "WORKERNAME", job_id: "JOBID", extranonce2: "00000000", ntime: "NTIME", nonce: "NONCE"});
  }
  start(options) {
    this.client = new net.Socket();

    this.client.setEncoding('utf8');

    const updatedOptions = extend({}, defaultConfig, options);

    validateConfig(updatedOptions);

    const workObject = new WorkObject();

    connect(this.client, updatedOptions);

    this.client.on('data', data => onData(this.client, updatedOptions, data, workObject));

    this.client.on('error', error => onError(this.client, updatedOptions, error));

    this.client.on('close', () => {
      if (updatedOptions.onClose) updatedOptions.onClose();
      /*
        For some reason, corrupted data keeps streaming. This is a hack.
        With this hack, I am ensuring that no more callbacks are called
        after closing the connection (closing from our end)
      */
      extend(updatedOptions, {
        onConnect: null,
        onClose: null,
        onError: null,
        onAuthorize: null,
        onAuthorizeSuccess: null,
	onAuthorizeFail: null,
        onNewDifficulty: null,
        onSubscribe: null,
        onNewMiningWork: null,
	onSubmitWorkSuccess: null,
	onSubmitWorkFail: null,
      });
    });
    
    return {
      submit: (text) => {
	this.submit(text);
      },
      shutdown: () => {
        this.client.end();
        this.client.destroy();
      },
    };
  }

};

module.exports = (options) => new Client().start(options);
