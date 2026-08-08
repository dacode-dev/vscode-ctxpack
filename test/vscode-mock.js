const registered = {};
let clipboardContent = "";
const infoMessages = [];
const errorMessages = [];

module.exports = {
  __test: {
    registered,
    getClipboard: () => clipboardContent,
    getInfoMessages: () => infoMessages,
    getErrorMessages: () => errorMessages,
    reset: () => {
      infoMessages.length = 0;
      errorMessages.length = 0;
    },
  },
  commands: {
    registerCommand: (name, fn) => {
      registered[name] = fn;
      return { dispose() {} };
    },
  },
  window: {
    showInformationMessage: (msg) => {
      infoMessages.push(msg);
    },
    showErrorMessage: (msg) => {
      errorMessages.push(msg);
    },
    showInputBox: async () => "main",
  },
  workspace: {
    workspaceFolders: null,
    getConfiguration: () => ({
      get: (key, def) => def,
    }),
  },
  env: {
    clipboard: {
      writeText: async (text) => {
        clipboardContent = text;
      },
    },
  },
};
