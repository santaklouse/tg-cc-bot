const presets = [
    [
        "@babel/env",
        {
            targets: {
                "node": true,
                "esmodules": true
            },
            useBuiltIns: "usage",
        },
    ],
];

module.exports = { presets };
