"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ready = exports.tensor2d = exports.tensor = exports.loadLayersModel = exports.node = void 0;
exports.node = {
    decodeImage: jest.fn(),
    encodeJpeg: jest.fn(),
    encodePng: jest.fn(),
};
exports.loadLayersModel = jest.fn();
exports.tensor = jest.fn();
exports.tensor2d = jest.fn();
exports.ready = jest.fn().mockResolvedValue(undefined);
exports.default = {
    node: exports.node,
    loadLayersModel: exports.loadLayersModel,
    tensor: exports.tensor,
    tensor2d: exports.tensor2d,
    ready: exports.ready
};
