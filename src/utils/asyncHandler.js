const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            return await requestHandler(req, res, next);
        } catch (err) {
            return next(err);
        }
    };
};

export default asyncHandler;