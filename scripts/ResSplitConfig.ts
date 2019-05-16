const config = {
    channel: "gaotong",
    rootPath: "http://egretgame.oss-cn-beijing.aliyuncs.com/V2/game/",
    versionBegin: 400,
    assets: {
        jh: {
            matchPath: ["resource/assets/game/jh/"],
            type: 4,
            enabled: true
        },
        nn: {
            matchPath: ["resource/assets/game/nn/"],
            type: 12,
            enabled: true
        },
        pdk: {
            matchPath: ["resource/assets/game/pdk/"],
            type: 16,
            enabled: true
        },
        dragonTiger: {
            matchPath: ["resource/assets/game/dragonTiger/"],
            type: 18,
            enabled: true
        },
        baccarat: {
            matchPath: ["resource/assets/game/baccarat/"],
            type: 19,
            enabled: true
        },
        bairenNiuniu: {
            matchPath: ["resource/assets/game/bairenNiuniu/"],
            type: 14,
            enabled: true
        },
        sg: {
            matchPath: ["resource/assets/game/sangong/"],
            type: 20,
            enabled: true
        },
        ebg: {
            matchPath: ["resource/assets/game/erbagang/"],
            type: 21,
            enabled: true
        },
        tb: {
            matchPath: ["resource/assets/game/toubao/"],
            type: 22,
            enabled: true
        },
        sgj: {
            matchPath: ["resource/assets/game/sgj/"],
            type: 30,
            enabled: false
        },
        cs: {
            matchPath: ["resource/assets/game/cs/"],
            type: 31,
            enabled: false
        },
        landLord: {
            matchPath: ["resource/assets/game/landLord/"],
            type: 2,
            enabled: true
        },
        fish: {
            matchPath: ["resource/assets/game/fish/"],
            type: 33,
            enabled: false
        },
        qznn: {
            "matchPath": ["resource/assets/game/nn/"],
            "type": 34,
            "enabled": true
        },
        common: {
            matchPath: [
                "resource/assets/common/",
                "resource/assets/float/",
                "resource/assets/loading/",
                "resource/assets/lobby/",
                "resource/assets/login/",
                "resource/assets/lottery/",
                "resource/assets/prestrain/",
                "resource/default.res.json",
                "resource/default.thm.json"
            ]
        }
    }
};

export = config;