import kaplay from "kaplay";

const PLAYER_SPEED = 480;

const WINDOW_WIDTH_IN_PX = window.screen.width;
const WINDOW_HEIGHT_IN_PX = window.screen.height;

// TODO: later map size should scale with a difficulty slider
const MAP_SIZE_IN_COLS = 24;
const MAP_SIZE_IN_ROWS = MAP_SIZE_IN_COLS / 2;
const NEUTRON_RADIUS_IN_PX = 8;
//const URANIUM_RADIUS_IN_PX = 18;
//const URANIUM_SPACING_IN_PX = 64;
const CONTROL_ROD_WIDTH_IN_PX = 16;



const URANIUM_SPACING_IN_PX = WINDOW_WIDTH_IN_PX / (MAP_SIZE_IN_COLS + 2.5);
const URANIUM_RADIUS_IN_PX = 0.25 * URANIUM_SPACING_IN_PX
const BOUNDS_OFFSET_IN_PX = 1.5 * URANIUM_SPACING_IN_PX;

const MAP_WIDTH_IN_PX = (MAP_SIZE_IN_COLS + 0.25) * URANIUM_SPACING_IN_PX;
const MAP_HEIGHT_IN_PX = (MAP_SIZE_IN_ROWS + 0.25) * URANIUM_SPACING_IN_PX;
const MAP_WALL_WIDTH_IN_PX = 24;

const PLAYER_Z = 12;
const CONTROL_ROD_Z = 11;
const NEUTRON_Z = 10;
const URANIUM_Z = 2;
const DOCILE_URANIUM_Z = 2;
const WATER_Z = 1;

const BACKGROUND_COLOR = [253, 246, 227];
const URANIUM_COLOR = [38, 139, 210];
const DOCILE_URANIUM_COLOR = [147, 161, 161];
const NEUTRON_COLOR = [0, 43, 54];
const CONTROL_ROD_COLOR = [0, 43, 54];
const COOL_WATER_COLOR = [173, 216, 230];
const HOT_WATER_COLOR = [220, 50, 47];
const CONTROL_ROD_SPACING_IN_COLS = 4;  // In units of uranium atoms
const URANIUM_SPAWN_CHANCE_ON_INIT = 0.1;
const NEUTRON_SPAWN_CHANCE_PER_FRAME = 0.0003;
const NEUTRON_ABSORB_CHANCE_PER_FRAME = 0.01;
const URANIUM_SPAWN_CHANCE_PER_FRAME = 0.0002;
const WATER_COOLING_RATE_PER_SECOND = 0.025;
const k = kaplay({
    background: BACKGROUND_COLOR
});


k.loadRoot("./");
k.loadSprite("crab", "sprites/crab.png");
k.loadSprite("yuri", "sprites/yuri.png", {
    sliceX: 56,
    sliceY: 20,
    anims: {
        idleRight: { from: 56, to: 61, loop: true },
        idleUp: { from: 62, to: 67, loop: true },
        idleLeft: { from: 68, to: 73, loop: true },
        idleDown: { from: 74, to: 79, loop: true },
    },
});
k.loadSound("pop", "sounds/pop.mp3");

function getRndVector({ min_angle, max_angle } = { min_angle: 0, max_angle: 2 * Math.PI }) {
    const angle = Math.random() * (max_angle - min_angle) + min_angle;
    return k.vec2(
        Math.cos(angle),
        Math.sin(angle)
    );
}

function spawnNeutron({ pos, dir }) {
    k.add([
        k.pos(pos.x, pos.y),
        k.circle(NEUTRON_RADIUS_IN_PX),
        k.area(),
        k.color(NEUTRON_COLOR),
        k.z(NEUTRON_Z),
        { dir: k.vec2(dir.x, dir.y) },
        "neutron"
    ]);
}

function spawnUranium({ pos }) {
    k.add([
        k.pos(pos.x, pos.y),
        k.circle(URANIUM_RADIUS_IN_PX),
        k.area(),
        k.color(URANIUM_COLOR),
        k.z(URANIUM_Z),
        "uranium"
    ]);
}

function spawnDocileUranium({ pos }) {
    k.add([
        k.pos(pos.x, pos.y),
        k.circle(URANIUM_RADIUS_IN_PX),
        k.color(DOCILE_URANIUM_COLOR),
        k.z(DOCILE_URANIUM_Z),
        "docile"
    ]);
}

function spawnWaterCell({ pos }) {
    return k.add([
        k.pos(pos.x, pos.y),
        k.rect(URANIUM_SPACING_IN_PX, URANIUM_SPACING_IN_PX),
        k.color(COOL_WATER_COLOR),
        k.z(WATER_Z),
        k.anchor("center"),
        { temp: 0 },
        "water"
    ]);
}

function spawnControlRod({ pos }) {
    k.add([
        k.pos(pos.x, pos.y),
        k.rect(CONTROL_ROD_WIDTH_IN_PX, MAP_HEIGHT_IN_PX),
        k.area(),
        k.body({ isStatic: true }),
        k.color(CONTROL_ROD_COLOR),
        k.anchor("top"),
        k.z(CONTROL_ROD_Z),
        "control_rod"
    ]);
};

let water = create2DArray(MAP_SIZE_IN_COLS, MAP_SIZE_IN_ROWS, null);

function spawnReactor() {
    // add left wall
    add([
        k.rect(MAP_WALL_WIDTH_IN_PX, 2 * MAP_WALL_WIDTH_IN_PX + MAP_HEIGHT_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX,
            BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0),
        "wall"
    ]);

    // add right wall
    add([
        k.rect(MAP_WALL_WIDTH_IN_PX, 2 * MAP_WALL_WIDTH_IN_PX + MAP_HEIGHT_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX + MAP_WALL_WIDTH_IN_PX - URANIUM_SPACING_IN_PX + MAP_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0),
        "wall"
    ]);

    // add top wall
    add([
        k.rect(MAP_WIDTH_IN_PX, MAP_WALL_WIDTH_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX + MAP_WALL_WIDTH_IN_PX - URANIUM_SPACING_IN_PX,
            BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0),
        "wall"
    ]);

    // add bottom wall
    add([
        k.rect(MAP_WIDTH_IN_PX, MAP_WALL_WIDTH_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX + MAP_WALL_WIDTH_IN_PX - URANIUM_SPACING_IN_PX,
            BOUNDS_OFFSET_IN_PX + MAP_WALL_WIDTH_IN_PX + MAP_HEIGHT_IN_PX - URANIUM_SPACING_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0),
        "wall"
    ]);

    for (let i = 0; i < MAP_SIZE_IN_COLS; i += 1) {
        if ((i + 3) % CONTROL_ROD_SPACING_IN_COLS == 0) {
            spawnControlRod({ pos: { x: BOUNDS_OFFSET_IN_PX + (i * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX } });
        };
        for (let j = 0; j < MAP_SIZE_IN_ROWS; j += 1) {
            if (Math.random() < URANIUM_SPAWN_CHANCE_ON_INIT) {
                spawnUranium({ pos: { x: BOUNDS_OFFSET_IN_PX + (i * URANIUM_SPACING_IN_PX), y: BOUNDS_OFFSET_IN_PX + (j * URANIUM_SPACING_IN_PX) } });
            } else {
                spawnDocileUranium({ pos: { x: BOUNDS_OFFSET_IN_PX + (i * URANIUM_SPACING_IN_PX), y: BOUNDS_OFFSET_IN_PX + (j * URANIUM_SPACING_IN_PX) } });
            }
            let waterCell = spawnWaterCell({ pos: { x: BOUNDS_OFFSET_IN_PX + (i * URANIUM_SPACING_IN_PX), y: BOUNDS_OFFSET_IN_PX + (j * URANIUM_SPACING_IN_PX) } });
            water[i][j] = waterCell;
        }
    }
}

function create2DArray(rows, cols, initialValue) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => initialValue)
    );
}

k.scene("main", () => {
    const player = k.add([
        k.sprite("yuri"),
        k.pos(BOUNDS_OFFSET_IN_PX, MAP_HEIGHT_IN_PX / 2),
        k.area(),
        k.body(),
        k.z(PLAYER_Z),
        { dir: k.vec2(0, 0) },
        { controlRodContactStartPos: k.vec2(0, 0) },
        "player"
    ]);

    player.play("idleDown");

    spawnReactor();

    // TODO: Record a history of the count to render to a line chart?
    const neutronCounter = k.add([
        k.pos(window.screen.width / 2, 20),
        k.text("Neutrons: 0", { size: 16 }),
        k.color(0, 0, 0),
        k.anchor("center"),
        { neutronCount: 0 }
    ]);

    neutronCounter.onUpdate(() => {
        neutronCounter.text = `Neutrons: ${k.get("neutron").length}`
    });

    function move_player() {
        let dir = k.vec2(0, 0);

        if (k.isKeyDown("a")) {
            dir.x -= 1;
            player.play("idleLeft");
        }
        if (k.isKeyDown("d")) {
            dir.x += 1;
            player.play("idleRight");
        }
        if (k.isKeyDown("w")) {
            dir.y -= 1;
            player.play("idleUp");
        }
        if (k.isKeyDown("s")) {
            dir.y += 1;
            player.play("idleDown");
        }

        dir = dir.unit();
        player.dir = dir;
        player.move(player.dir.scale(PLAYER_SPEED));
    }

    k.onUpdate(() => {
        move_player();
    })

    k.onUpdate("neutron", (neutron) => {
        let x = Math.min(Math.max(Math.floor((neutron.pos.x - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_COLS - 1);
        let y = Math.min(Math.max(Math.floor((neutron.pos.y - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_ROWS - 1);
        if (Math.random() < NEUTRON_ABSORB_CHANCE_PER_FRAME && water[x][y].temp < 1.0) {
            water[x][y].temp += 0.1;
            neutron.destroy();
            // k.debug.log(`absorbed at ${x}, ${y}, water[${x}][${y}].temp = ${water[x][y].temp}`);
        }

        neutron.move(neutron.dir.scale(300));
    });

    k.onUpdate("docile", (docile) => {
        if (Math.random() < NEUTRON_SPAWN_CHANCE_PER_FRAME) {
            spawnNeutron({ pos: docile.pos, dir: getRndVector() });
        }
    });

    k.onUpdate("docile", (docile) => {
        if (Math.random() < URANIUM_SPAWN_CHANCE_PER_FRAME) {
            spawnUranium({ pos: docile.pos });
            docile.destroy();
        }
    });

    k.onCollide("neutron", "control_rod", (neutron) => {
        neutron.destroy();
    });

    k.onCollide("neutron", "wall", (neutron) => {
        neutron.destroy();
    });

    k.onCollide("neutron", "uranium", (neutron, uranium, collision) => {
        // Spawn two neutrons with fully random directions
        for (let i = 0; i < 2; i++) {
            spawnNeutron({
                pos: {
                    x: uranium.pos.x,
                    y: uranium.pos.y
                },
                dir: getRndVector()
            })
        }

        // Spawn a single neutron with a direction based on the original
        const angle = Math.atan2(neutron.dir.y, neutron.dir.x);
        spawnNeutron({
            pos: {
                x: uranium.pos.x,
                y: uranium.pos.y
            },
            dir: getRndVector({
                min_angle: angle - Math.PI / 12,
                max_angle: angle + Math.PI / 12
            })
        })

        spawnDocileUranium({
            pos: {
                x: uranium.pos.x,
                y: uranium.pos.y
            }
        });

        neutron.destroy();
        uranium.destroy();

        k.play("pop", { volume: 0.2 });
    });

    k.onCollide("player", "control_rod", (player, controlRod, collision) => {
        player.controlRodContactStartPos = player.pos;
        // k.debug.log(player.controlRodContactStartPos.y);
    });

    k.onCollideUpdate("player", "control_rod", (player, controlRod, collision) => {
        if (k.isKeyDown("space")) {
            const ceiling = BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX;

            let rod_current_pos = controlRod.pos;
            let delta = player.pos.y - player.controlRodContactStartPos.y;

            controlRod.pos = k.vec2(
                rod_current_pos.x,
                Math.min(rod_current_pos.y + delta, ceiling)
            );

            player.controlRodContactStartPos = player.pos;
        }
    });

    k.onUpdate("water", (water) => {
        water.temp = Math.max(water.temp - WATER_COOLING_RATE_PER_SECOND * k.dt(), 0);

        if (water.temp >= 1) {
            water.color = k.WHITE;
        } else {
            const hue = (1 - Math.min(water.temp, 1)) * 195; // 240 = blue, 0 = red
            const saturation = 0.53;
            const lightness = 0.79;
            
            water.color = k.Color.fromHSL(hue / 360, saturation, lightness);
        }

    });
});

k.go("main");
