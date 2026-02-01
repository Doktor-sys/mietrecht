export const node = {
    decodeImage: jest.fn(),
    encodeJpeg: jest.fn(),
    encodePng: jest.fn(),
};

export const loadLayersModel = jest.fn();
export const tensor = jest.fn();
export const tensor2d = jest.fn();
export const ready = jest.fn().mockResolvedValue(undefined);

export default {
    node,
    loadLayersModel,
    tensor,
    tensor2d,
    ready
};
