import kaplay from "kaplay";

const PLAYER_HP = 50;
const PLAYER_SPEED = 400;
const ROD_SPEED = 36;
const NEUTRON_SPEED = 150;
const FAST_NEUTRON_SPEED = 300;

const WINDOW_WIDTH_IN_PX = window.screen.width;
const WINDOW_HEIGHT_IN_PX = window.screen.height;
const MIN_DIMENSION = Math.min(WINDOW_HEIGHT_IN_PX, WINDOW_WIDTH_IN_PX)

// TODO: later map size should scale with a difficulty slider
const MAP_SIZE_IN_COLS = 24;
const MAP_SIZE_IN_ROWS = 12;

const URANIUM_SPACING_IN_PX = Math.floor(0.85 * MIN_DIMENSION / (MAP_SIZE_IN_ROWS + 2.5));
const URANIUM_RADIUS_IN_PX = 0.25 * URANIUM_SPACING_IN_PX
const BOUNDS_OFFSET_IN_PX = 1.5 * URANIUM_SPACING_IN_PX;

const MAP_WIDTH_IN_PX = (MAP_SIZE_IN_COLS) * URANIUM_SPACING_IN_PX;
const MAP_HEIGHT_IN_PX = (MAP_SIZE_IN_ROWS) * URANIUM_SPACING_IN_PX;
const MAP_WALL_WIDTH_IN_PX = Math.floor(0.02 * MIN_DIMENSION);
const NEUTRON_RADIUS_IN_PX = URANIUM_RADIUS_IN_PX / 3;
const CONTROL_ROD_WIDTH_IN_PX = URANIUM_SPACING_IN_PX / 4;

const PLAYER_Z = 13;
const CONTROL_ROD_Z = 11;
const NEUTRON_Z = 12;
const URANIUM_Z = 2;
const DOCILE_URANIUM_Z = 2;
const WATER_Z = 1;
const WALL_Z = 16;
const BACKGROUND_Z = 15;
const TEXT_Z = 17;

const BACKGROUND_COLOR = [253, 246, 227];
const URANIUM_COLOR = [38, 139, 210];
const DOCILE_URANIUM_COLOR = [147, 161, 161];
const NEUTRON_COLOR = [0, 43, 54];
const FAST_NEUTRON_COLOR = [203, 75, 22];
const BUTTON_COLOR = [220, 50, 47];
const CONTROL_ROD_COLOR = [7, 54, 66];
const WALL_COLOR = [0, 0, 0];
const XENON_COLOR = CONTROL_ROD_COLOR;
const COOL_WATER_COLOR = [173, 216, 230];
const HOT_WATER_COLOR = [255, 105, 97];
const CONTROL_ROD_SPACING_IN_COLS = 4;  // In units of uranium atoms
const URANIUM_SPAWN_CHANCE_ON_INIT = 0.1;
const NEUTRON_SPAWN_CHANCE_PER_FRAME = 0.0024;
const XENON_SPAWN_CHANCE_ON_IMPACT = 0.15;
const NEUTRON_ABSORB_CHANCE_PER_FRAME = 0.02;
const URANIUM_SPAWN_CHANCE_PER_FRAME = 0.0024;
const WATER_COOLING_RATE_PER_SECOND = 0.012;
const NEUTRON_HEAT_ADDITION = 0.1;
const URANIUM_HEAT_ADDITION = 0.4;

const NEUTRON_TARGET = 36;
const NEUTRON_DELTA = 10;
const TARGET_TIMER_SECS = 8;

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
k.loadSound("absorb", "sounds/cancel.mp3");
k.loadSound("hit", "sounds/hit.mp3");

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
        k.area({ collisionIgnore: ["neutron", "fastNeutron"] }),
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
        k.area({ collisionIgnore: ["neutron", "fastNeutron"] }),
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
    // add raise button
    add([
        k.rect(URANIUM_SPACING_IN_PX / 1.5, URANIUM_SPACING_IN_PX / 4),
        k.anchor("bot"),
        k.pos(
            BOUNDS_OFFSET_IN_PX + (URANIUM_SPACING_IN_PX/2),
            BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)
        ),
        k.area({ collisionIgnore: ["neutron", "fastNeutron"] }),
        k.body({ isStatic: true }),
        k.color(BUTTON_COLOR),
        k.outline({ width: 0, color: k.YELLOW }),
        k.z(CONTROL_ROD_Z),
        "raiseButton"
    ]);

    add([
        k.pos(
            BOUNDS_OFFSET_IN_PX + (URANIUM_SPACING_IN_PX/2),
            BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)
        ),
        k.text("UP", { size: URANIUM_SPACING_IN_PX / 5 }),
        k.color(WALL_COLOR),
        k.anchor("bot"),
        k.z(TEXT_Z)
    ]);

    // add SCRAM button
    add([
        k.rect(URANIUM_SPACING_IN_PX / 1.5, URANIUM_SPACING_IN_PX / 4),
        k.anchor("bot"),
        k.pos(
            BOUNDS_OFFSET_IN_PX - (1.5* URANIUM_SPACING_IN_PX) + MAP_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)
        ),
        k.area({ collisionIgnore: ["neutron", "fastNeutron"] }),
        k.body({ isStatic: true }),
        k.color(BUTTON_COLOR),
        k.outline({ width: 0, color: k.YELLOW }),
        k.z(CONTROL_ROD_Z),
        "scramButton"
    ]);

    add([
        k.pos(
            BOUNDS_OFFSET_IN_PX - (1.5* URANIUM_SPACING_IN_PX) + MAP_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)
        ),
        k.text("SCRAM", { size: URANIUM_SPACING_IN_PX / 5 }),
        k.color(WALL_COLOR),
        k.anchor("bot"),
        k.z(TEXT_Z)
    ]);

    // add "roof"
    add([
        k.rect(
            WINDOW_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) + MAP_HEIGHT_IN_PX
        ),
        k.anchor("topleft"),
        k.pos(0, -1*MAP_HEIGHT_IN_PX),
        k.color(BACKGROUND_COLOR),
        k.body({ isStatic: true }),
        k.z(BACKGROUND_Z)
    ]);

    // add "floor"
    add([
        k.rect(
            WINDOW_WIDTH_IN_PX,
            WINDOW_HEIGHT_IN_PX - MAP_HEIGHT_IN_PX - BOUNDS_OFFSET_IN_PX - 2*MAP_WALL_WIDTH_IN_PX
        ),
        k.anchor("topleft"),
        k.pos(0, BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)),
        k.color(BACKGROUND_COLOR),
        k.body({ isStatic: true }),
        k.z(BACKGROUND_Z)
    ]);

    // add left wall
    add([
        k.rect(MAP_WALL_WIDTH_IN_PX, 2 * MAP_WALL_WIDTH_IN_PX + MAP_HEIGHT_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) - MAP_WALL_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) - MAP_WALL_WIDTH_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(WALL_COLOR),
        k.z(WALL_Z),
        "wall"
    ]);

    // add right wall
    add([
        k.rect(MAP_WALL_WIDTH_IN_PX, 2 * MAP_WALL_WIDTH_IN_PX + MAP_HEIGHT_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) + MAP_WIDTH_IN_PX,
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) - MAP_WALL_WIDTH_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(WALL_COLOR),
        k.z(WALL_Z),
        "wall"
    ]);

    // add top wall
    add([
        k.rect(MAP_WIDTH_IN_PX, MAP_WALL_WIDTH_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2),
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) - MAP_WALL_WIDTH_IN_PX
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(WALL_COLOR),
        k.z(WALL_Z),
        "wall"
    ]);

    // add bottom wall
    add([
        k.rect(MAP_WIDTH_IN_PX, MAP_WALL_WIDTH_IN_PX),
        k.pos(
            BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2),
            BOUNDS_OFFSET_IN_PX + MAP_HEIGHT_IN_PX - (URANIUM_SPACING_IN_PX/2)
        ),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(WALL_COLOR),
        k.z(WALL_Z),
        "wall"
    ]);

    for (let i = 0; i < MAP_SIZE_IN_COLS; i += 1) {
        if ((i + 3) % CONTROL_ROD_SPACING_IN_COLS == 0) {
            spawnControlRod({ pos: { x: BOUNDS_OFFSET_IN_PX + (i * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2)} });
            spawnModerator({ pos: { x: BOUNDS_OFFSET_IN_PX + ((i-2) * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) }, height_px: MAP_HEIGHT_IN_PX });
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


    spawnModerator({ pos: { x: BOUNDS_OFFSET_IN_PX + ((MAP_SIZE_IN_COLS - 1) * URANIUM_SPACING_IN_PX) + (URANIUM_SPACING_IN_PX / 2), y: BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2) }, height_px: MAP_HEIGHT_IN_PX });
}

function create2DArray(rows, cols, initialValue) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => initialValue)
    );
}

k.scene("main", () => {
    let lastUpdate = Date.now();
    let raise_rods = false;
    let scram = false;
    let remaining_time = TARGET_TIMER_SECS;
    let timer = 0;

    const player = k.add([
        k.sprite("yuri"),
        k.pos(BOUNDS_OFFSET_IN_PX, MAP_HEIGHT_IN_PX / 2),
        k.area(),
        k.body(),
        k.z(PLAYER_Z),
        { dir: k.vec2(0, 0) },
        { currentAnim: null },
        { health: PLAYER_HP },
        "player"
    ]);

    player.play("walkRight");

    spawnReactor();
    //k.debug.log(`Width: ${WINDOW_WIDTH_IN_PX}`);
    //k.debug.log(`Height: ${WINDOW_HEIGHT_IN_PX}`);

    // TODO: Record a history of the count to render to a line chart?
    const neutronCounter = k.add([
        k.pos(BOUNDS_OFFSET_IN_PX + 0.5*MAP_WIDTH_IN_PX, BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX/2 + MAP_HEIGHT_IN_PX + 2*MAP_WALL_WIDTH_IN_PX),
        k.text("Thermal Neutrons: 0"),
        k.scale(0.5),
        k.color(BUTTON_COLOR),
        k.anchor("center"),
        k.z(TEXT_Z),
        { neutronCount: 0 }
    ]);

    const xenonCounter = k.add([
        k.pos(BOUNDS_OFFSET_IN_PX + 0.25*MAP_WIDTH_IN_PX, BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX/2 + MAP_HEIGHT_IN_PX + 2*MAP_WALL_WIDTH_IN_PX),
        k.text("Xenon: 0"),
        k.scale(0.5),
        k.color(0, 0, 0),
        k.anchor("center"),
        k.z(TEXT_Z),
        { xenonCount: 0 }
    ]);

    const healthCounter = k.add([
        k.pos(BOUNDS_OFFSET_IN_PX, BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX/2 + MAP_HEIGHT_IN_PX + 2*MAP_WALL_WIDTH_IN_PX),
        k.text("HP: 0"),
        k.scale(0.5),
        k.color(0, 0, 0),
        k.anchor("left"),
        k.z(TEXT_Z),
        { hp: 0 }
    ]);

    const timeCounter = k.add([
        k.pos(BOUNDS_OFFSET_IN_PX + 0.75*MAP_WIDTH_IN_PX, BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX/2 + MAP_HEIGHT_IN_PX + 2*MAP_WALL_WIDTH_IN_PX),
        k.text("Time Remaining: 0 seconds"),
        k.scale(0.5),
        k.color(0, 0, 0),
        k.anchor("center"),
        k.z(TEXT_Z),
        { time: 0 }
    ]);

    neutronCounter.onUpdate(() => {
        let present = Date.now();
        let delta = (present - lastUpdate) / 1000;
        lastUpdate = present;

        let n_neutrons = k.get("neutron").length;
        neutronCounter.text = `Thermal Neutrons: ${n_neutrons}`;
        if (n_neutrons <= NEUTRON_TARGET + NEUTRON_DELTA && n_neutrons >= NEUTRON_TARGET - NEUTRON_DELTA) {
            neutronCounter.color = new k.Color(133, 153, 0);
            timer += delta;
        }
        else {
            neutronCounter.color = new k.Color(220, 50, 47);
            timer = 0;
        };
    });

    xenonCounter.onUpdate(() => {
        xenonCounter.text = `Xenon: ${k.get("xenon").length}`
    });

    healthCounter.onUpdate(() => {
        healthCounter.text = `HP: ${k.get("player")[0].health}/${PLAYER_HP}`
    });

    timeCounter.onUpdate(() => {
        remaining_time = TARGET_TIMER_SECS - timer;
        timeCounter.text = `Time Remaining: ${Math.floor(remaining_time)} seconds`;
        if (remaining_time <= 0) {
            k.go("end", 'Congratulations! Your operating is commendable.');
        }
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

    k.onUpdate("neutron", (neutron) => {
        let x = Math.min(Math.max(Math.floor((neutron.pos.x - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_COLS - 1);
        let y = Math.min(Math.max(Math.floor((neutron.pos.y - (BOUNDS_OFFSET_IN_PX - URANIUM_SPACING_IN_PX)) / URANIUM_SPACING_IN_PX), 0), MAP_SIZE_IN_ROWS - 1);
        if (Math.random() < NEUTRON_ABSORB_CHANCE_PER_FRAME && water[x][y].temp < 1.0) {
            water[x][y].temp += NEUTRON_HEAT_ADDITION;
            neutron.destroy();
        }

        neutron.move(neutron.dir.scale(NEUTRON_SPEED));
    });

    k.onUpdate("fastNeutron", (fastNeutron) => {
        fastNeutron.move(fastNeutron.dir.scale(FAST_NEUTRON_SPEED));
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

    k.onCollide("neutron", "player", (neutron, player) => {
        player.health -= 1;
        neutron.destroy();
        k.play("hit", { volume: 0.5 });
        k.shake();
    });

    k.onCollide("fastNeutron", "player", (fastNeutron, player) => {
        if (Math.random() < 0.05) {
            player.health -= 10;
            fastNeutron.destroy;
            k.shake();
        }
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

    // k.onCollide("player", "controlRod", (player, controlRod, collision) => {
    //     player.controlRodContactStartPos = player.pos;
    // });

    k.onUpdate("controlRod", (controlRod) => {
        let dir = k.vec2(0, 0);

        if (raise_rods) dir.y = -1;
        if (scram) dir.y = 1;
        controlRod.move(dir.scale(ROD_SPEED));

        let final_y = Math.min(Math.max(-1*MAP_HEIGHT_IN_PX + URANIUM_SPACING_IN_PX, controlRod.pos.y), BOUNDS_OFFSET_IN_PX - (URANIUM_SPACING_IN_PX/2))
        controlRod.pos.y = final_y
    });

    k.onCollideUpdate("player", "controlRod", (player, controlRod, collision) => {
        if (k.isKeyDown("space")) {
            const ceiling = BOUNDS_OFFSET_IN_PX - MAP_HEIGHT_IN_PX;

            let dir = k.vec2(0, player.dir.y);
            controlRod.move(dir.scale(PLAYER_SPEED/1.9));
            controlRod.outline.width = 4;
            controlRod.outline.color = k.YELLOW;

            controlRod.pos = k.vec2(
                controlRod.pos.x,
                Math.max(controlRod.pos.y, ceiling)
            );
        }
    });

    k.onCollideUpdate("player", "raiseButton", (player, raiseButton, collision) => {
        if (k.isKeyDown("space")) {
            raiseButton.outline.width = 4;
            raiseButton.outline.color = k.YELLOW;
            raise_rods = true;
        }
    });

    k.onCollideUpdate("player", "scramButton", (player, scramButton, collision) => {
        if (k.isKeyDown("space")) {
            scramButton.outline.width = 4;
            scramButton.outline.color = k.YELLOW;
            scram = true;
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
        move_player();

        const touchingRod = k.get("controlRod").some(rod => player.isColliding(rod));
        const touchingUpButton = k.get("raiseButton").some(button => player.isColliding(button));
        const touchingScramButton = k.get("scramButton").some(button => player.isColliding(button));

        if (!k.isKeyDown("space") || !touchingRod) {
            k.get("controlRod").forEach(rod => {
                rod.outline.width = 0;
                rod.outline.color = k.BLACK;
            });
        }

        if (!k.isKeyDown("space") || !touchingUpButton) {
            k.get("raiseButton").forEach(button => {
                button.outline.width = 0;
                button.outline.color = k.BLACK;
            });
            raise_rods = false;
        }

        if (!k.isKeyDown("space") || !touchingScramButton) {
            k.get("scramButton").forEach(button => {
                button.outline.width = 0;
                button.outline.color = k.BLACK;
            });
            scram = false;
        }

        if (player.health <= 0) {
            k.go("end", 'You died of radiation poisoning.');
            k.burp();
            k.addKaboom(player.pos);
        }


    });
});

scene("end", (message) => {
    add([
        k.text(message),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2),
        k.scale(2),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    add([
        k.text('Click anywhere or press Space to play again.'),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2 + 3*URANIUM_SPACING_IN_PX),
        k.scale(1.5),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    k.onKeyPress("space", () => go("main"));
    k.onClick(() => go("main"));
});

scene("start", () => {
    add([
        k.text('SCRAM!'),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2),
        k.scale(3),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    add([
        k.text(`Maintain ${NEUTRON_TARGET} +/- ${NEUTRON_DELTA} thermal neutrons for ${TARGET_TIMER_SECS} seconds to win.`),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2 + 2*URANIUM_SPACING_IN_PX),
        k.scale(1.0),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    add([
        k.text('Don\'t melt down!'),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2 + 3*URANIUM_SPACING_IN_PX),
        k.scale(1.0),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    add([
        k.text('Click anywhere or press Space to begin.'),
        k.pos(WINDOW_WIDTH_IN_PX / 2, MAP_HEIGHT_IN_PX / 2 + 5*URANIUM_SPACING_IN_PX),
        k.scale(1.0),
        k.anchor("center"),
        k.color(CONTROL_ROD_COLOR)
    ]);

    // go back to game with space is pressed
    k.onKeyPress("space", () => go("main"));
    k.onClick(() => go("main"));
});

k.go("start");
