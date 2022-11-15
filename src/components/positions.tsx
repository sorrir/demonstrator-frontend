const hp = 250;

function getX(numHp: number) {
    return hp*numHp + 50;
}

export const presetPositions: {[key: string]: {x: number, y:number}} = {
    us: { x: getX(1), y: 150},
    cs: {x: getX(1), y: 700},
    prs: { x: getX(2), y: 450},
    sec: {x: getX(3), y: 49},
    cm_sec: {x: getX(3), y: 240},
    bm_sec: {x: getX(3), y: 340},
    sxc: {x: getX(3), y: 589},
    cm_sxc: {x: getX(3), y: 780},
    bm_sxc: {x: getX(3), y: 880},
    acs: {x: getX(4), y: 450},
    ws: {x: getX(6), y: 60},
    pms: {x: getX(5), y: 160},
    psp: {x: getX(6), y: 360},
    pss_0_0_0: {x: getX(5), y: 670},
    pss_1_0_0: {x: getX(5), y: 770},
    pss_0_1_0: {x: getX(6), y: 670},
    pss_1_1_0: {x: getX(6), y: 770},
    Consolidator1: {x: getX(7), y: 50},
    Consolidator2: {x: getX(7), y: 150},
    Consolidator3: {x: getX(7), y: 250},
    Consolidator4: {x: getX(7), y: 350},
    Consolidator5: {x: getX(7), y: 450},
    Consolidator6: {x: getX(7), y: 550},
    Consolidator7: {x: getX(7), y: 650},
    Consolidator8: {x: getX(7), y: 750},
}