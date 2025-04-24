import kaplay from "kaplay";

const PLAYER_SPEED = 480;
const ROD_SPEED = 24;

const WINDOW_WIDTH_IN_PX = window.screen.width;
const WINDOW_HEIGHT_IN_PX = window.screen.height;

// TODO: later map size should scale with a difficulty slider
const MAP_SIZE_IN_COLS = 24;
const MAP_SIZE_IN_ROWS = 12;
const NEUTRON_RADIUS_IN_PX = 8;
//const URANIUM_RADIUS_IN_PX = 18;
//const URANIUM_SPACING_IN_PX = 64;
const CONTROL_ROD_WIDTH_IN_PX = 16;



const URANIUM_SPACING_IN_PX = Math.floor(0.85 * WINDOW_HEIGHT_IN_PX / (MAP_SIZE_IN_ROWS + 2.5));
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
const FAST_NEUTRON_COLOR = [255, 255, 255];
const CONTROL_ROD_COLOR = [0, 43, 54];
const XENON_COLOR = CONTROL_ROD_COLOR;
const COOL_WATER_COLOR = [173, 216, 230];
const HOT_WATER_COLOR = [255, 105, 97];
const CONTROL_ROD_SPACING_IN_COLS = 4;  // In units of uranium atoms
const URANIUM_SPAWN_CHANCE_ON_INIT = 0.1;
const NEUTRON_SPAWN_CHANCE_PER_FRAME = 0.0048;
const XENON_SPAWN_CHANCE_ON_IMPACT = 0.15;
const NEUTRON_ABSORB_CHANCE_PER_FRAME = 0.10;
const URANIUM_SPAWN_CHANCE_PER_FRAME = 0.0024;
const WATER_COOLING_RATE_PER_SECOND = 0.05;
const NEUTRON_HEAT_ADDITION = 0.1;
const URANIUM_HEAT_ADDITION = 0.2;

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
        walkRight: { from: 112, to: 117, loop: true },
        walkUp: { from: 118, to: 123, loop: true },
        walkLeft: { from: 124, to: 129, loop: true },
        walkDown: { from: 130, to: 135, loop: true },
    },
});
k.loadSound("pop", "sounds/sharp-pop.mp3");

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
        k.offscreen({ destroy: true }),
        { dir: k.vec2(dir.x, dir.y) },
        "neutron"
    ]);
}

function spawnFastNeutron({ pos, dir }) {
    k.add([
        k.pos(pos.x, pos.y),
        k.circle(NEUTRON_RADIUS_IN_PX),
        k.area(),
        k.color(FAST_NEUTRON_COLOR),
        k.outline({ width: 3, color: k.BLACK }),
        k.z(NEUTRON_Z),
        k.offscreen({ destroy: true }),
        { dir: k.vec2(dir.x, dir.y) },
        "fastNeutron"
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

function spawnXenon({ pos }) {
    //k.debug.log("spawnXenon");
    k.add([
        k.pos(pos.x, pos.y),
        k.circle(URANIUM_RADIUS_IN_PX),
        k.color(XENON_COLOR),
        k.area(),
        k.z(DOCILE_URANIUM_Z),
        { collisionCountdown: 0.25 },
        "xenon"
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

function spawnModerator({ pos, height_px }) {
    return k.add([
        k.pos(pos.x, pos.y),
        k.rect(CONTROL_ROD_WIDTH_IN_PX, height_px), 
        k.area({ collisionIgnore: ["player"] }),
        k.body({ isStatic: true }),
        k.anchor("top"),
        k.z(CONTROL_ROD_Z),
        k.color(108, 113, 196),
        //k.outline({ width: 4, color: k.YELLOW }),
        "moderator"
    ]);
}

function spawnControlRod({ pos }) {
    const mod_pos = k.vec2(pos.x, pos.y + MAP_HEIGHT_IN_PX);
    const moderator = spawnModerator({ pos: mod_pos, height_px: MAP_HEIGHT_IN_PX/3 });

    const rod = k.add([
        k.pos(pos.x, pos.y),
        k.rect(CONTROL_ROD_WIDTH_IN_PX, MAP_HEIGHT_IN_PX),
        k.area(),
        k.body({ isStatic: true }),
        k.color(CONTROL_ROD_COLOR),
        k.anchor("top"),
        k.z(CONTROL_ROD_Z),
        k.outline({ width: 0, color: k.YELLOW }),
        {
            update() {
                moderator.pos = k.vec2(this.pos.x, this.pos.y + MAP_HEIGHT_IN_PX);
            },
            moderatorRef: moderator,
        },
        "controlRod"
    ]);

    return rod;
}

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
            spawnModerator({ pos: { x: BOUNDS_OFFSET_IN_PX + ((i-2) * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX }, height_px: MAP_HEIGHT_IN_PX });
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


    spawnModerator({ pos: { x: BOUNDS_OFFSET_IN_PX + ((MAP_SIZE_IN_COLS - 1) * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX }, height_px: MAP_HEIGHT_IN_PX });
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
        { currentAnim: null },
        "player"
    ]);

    player.play("walkRight");

    spawnReactor();
    k.debug.log(`Width: ${WINDOW_WIDTH_IN_PX}`);
    k.debug.log(`Height: ${WINDOW_HEIGHT_IN_PX}`);

    // TODO: Record a history of the count to render to a line chart?
    const neutronCounter = k.add([
        k.pos(window.screen.width / 2, 20),
        k.text("Neutrons: 0", { size: 16 }),
        k.color(0, 0, 0),
        k.anchor("center"),
        { neutronCount: 0 }
    ]);

    const xenonCounter = k.add([
        k.pos(window.screen.width / 4, 20),
        k.text("Xenon: 0", { size: 16 }),
        k.color(0, 0, 0),
        k.anchor("center"),
        { xenonCount: 0 }
    ]);

    neutronCounter.onUpdate(() => {
        neutronCounter.text = `Neutrons: ${k.get("neutron").length + k.get("fastNeutron").length}`
    });

    xenonCounter.onUpdate(() => {
        xenonCounter.text = `Xenon: ${k.get("xenon").length}`
    });

    function move_player() {
        let dir = k.vec2(0, 0);

        if (k.isKeyDown("a")) dir.x -= 1;
        if (k.isKeyDown("d")) dir.x += 1;
        if (k.isKeyDown("w")) dir.y -= 1;
        if (k.isKeyDown("s")) dir.y += 1;

        dir = dir.unit();
        player.move(dir.scale(PLAYER_SPEED));

        let newAnim = null;

        if (dir.x !== 0 || dir.y !== 0) {
            // Save last non-zero movement direction
            player.dir = dir;

            if (Math.abs(dir.x) > Math.abs(dir.y)) {
                newAnim = dir.x > 0 ? "walkRight" : "walkLeft";
            } else {
                newAnim = dir.y > 0 ? "walkDown" : "walkUp";
            }
        } else {
            // Standing still, use last movement direction
            if (Math.abs(player.dir.x) > Math.abs(player.dir.y)) {
                newAnim = player.dir.x > 0 ? "idleRight" : "idleLeft";
            } else {
                newAnim = player.dir.y > 0 ? "idleDown" : "idleUp";
            }
        }

        if (player.currentAnim !== newAnim) {
            player.play(newAnim);
            player.currentAnim = newAnim;
        }
    }

    k.onUpdate(() => {
        move_player();
    })

    k.onUpdate("neutron", (neutron) => {
        let x = Math.min(Math.max(Math.floor((neutron.pos.x - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_COLS - 1);
        let y = Math.min(Math.max(Math.floor((neutron.pos.y - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_ROWS - 1);
        if (Math.random() < NEUTRON_ABSORB_CHANCE_PER_FRAME && water[x][y].temp < 1.0) {
            water[x][y].temp += NEUTRON_HEAT_ADDITION;
            neutron.destroy();
            // k.debug.log(`absorbed at ${x}, ${y}, water[${x}][${y}].temp = ${water[x][y].temp}`);
        }

        neutron.move(neutron.dir.scale(300));
    });

    k.onUpdate("fastNeutron", (fastNeutron) => {
        fastNeutron.move(fastNeutron.dir.scale(450));
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

    k.onCollide("neutron", "controlRod", (neutron) => {
        neutron.destroy();
    });

    k.onCollide("neutron", "wall", (neutron) => {
        neutron.destroy();
    });

    k.onCollide("neutron", "uranium", (neutron, uranium, collision) => {
        // heat water
        let x = Math.min(Math.max(Math.floor((neutron.pos.x - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_COLS - 1);
        let y = Math.min(Math.max(Math.floor((neutron.pos.y - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_ROWS - 1);
        if (water[x][y] < 1.0) {
            water[x][y].temp += URANIUM_HEAT_ADDITION;
        }
        else {
            water[x][y].temp += URANIUM_HEAT_ADDITION/10;
        }

        // Spawn two neutrons with fully random directions
        for (let i = 0; i < 2; i++) {
            spawnFastNeutron({
                pos: {
                    x: uranium.pos.x,
                    y: uranium.pos.y
                },
                dir: getRndVector()
            })
        }

        // Spawn a single neutron with a direction based on the original
        const angle = Math.atan2(neutron.dir.y, neutron.dir.x);
        spawnFastNeutron({
            pos: {
                x: uranium.pos.x,
                y: uranium.pos.y
            },
            dir: getRndVector({
                min_angle: angle - Math.PI / 12,
                max_angle: angle + Math.PI / 12
            })
        })

        if (Math.random() < XENON_SPAWN_CHANCE_ON_IMPACT) {
            spawnXenon({
                pos: {
                    x: uranium.pos.x,
                    y: uranium.pos.y
                }
            });
        } else {
            spawnDocileUranium({
                pos: {
                    x: uranium.pos.x,
                    y: uranium.pos.y
                }
            });
        }

        neutron.destroy();
        uranium.destroy();

        k.play("pop", { volume: 0.2 });
    });

    k.onCollide("fastNeutron", "moderator", (fastNeutron, moderator, col) => {
        fastNeutron.destroy();

        spawnNeutron({
            pos: {
                x: fastNeutron.pos.x,
                y: fastNeutron.pos.y
            },
            dir: fastNeutron.dir.reflect(col.normal)
        })
    });

    k.onUpdate("xenon", (xenon) => {
        xenon.collisionCountdown -= 1 * k.dt();
        xenon.collisionCountdown = Math.max(0, xenon.collisionCountdown);
    });

    k.onCollide("neutron", "xenon", (neutron, xenon) => {
        if (xenon.collisionCountdown <= 0) {
            //k.debug.log("burnt off xenon");
            spawnDocileUranium({
                pos: {
                    x: xenon.pos.x,
                    y: xenon.pos.y
                }
            });
            xenon.destroy();
            neutron.destroy();
        }
    });

    k.onCollide("player", "controlRod", (player, controlRod, collision) => {
        player.controlRodContactStartPos = player.pos;
        // k.debug.log(player.controlRodContactStartPos.y);
    });

    k.onUpdate("controlRod", (controlRod) => {
        let dir = k.vec2(0, 0);

        if (k.isKeyDown("e")) dir.y = -1;
        if (k.isKeyDown("q")) dir.y = 1;
        controlRod.move(dir.scale(ROD_SPEED));

        let final_y = Math.min(Math.max(-1*MAP_HEIGHT_IN_PX + URANIUM_SPACING_IN_PX, controlRod.pos.y), BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX)
        controlRod.pos.y = final_y
    });

    k.onCollideUpdate("player", "controlRod", (player, controlRod, collision) => {
        if (k.isKeyDown("space")) {
            const ceiling = BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX + MAP_WALL_WIDTH_IN_PX;

            let rod_current_pos = controlRod.pos;
            let delta = player.pos.y - player.controlRodContactStartPos.y;

            controlRod.pos = k.vec2(
                rod_current_pos.x,
                Math.min(rod_current_pos.y + delta, ceiling)
            );

            player.controlRodContactStartPos = player.pos;
            controlRod.outline.width = 4;
            controlRod.outline.color = k.YELLOW;
        }
    });

    k.onUpdate("water", (water) => {
        // // Water cooling
        water.temp = Math.max(water.temp - WATER_COOLING_RATE_PER_SECOND * k.dt(), 0);

        if (water.temp >= 1) {
            water.color = k.WHITE;
        } else {
            water.color = k.lerp(
                new k.Color(173, 216, 230),
                new k.Color(255, 105, 97),
                water.temp
            );
        }

    });

    k.onUpdate(() => {
        const touchingRod = k.get("controlRod").some(rod => player.isColliding(rod));

        if (!k.isKeyDown("space") || !touchingRod) {
            k.get("controlRod").forEach(rod => {
                rod.outline.width = 0;
                rod.outline.color = k.BLACK;
            });
        }
    });
});

k.go("main");
