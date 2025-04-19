import kaplay from "kaplay";

const SPEED = 480;

// TODO: later map size should scale with a difficulty slider
const MAP_WIDTH = 512; 
const MAP_HEIGHT = 512;
const MAP_WALL = 24;
const BOUNDS_OFFSET = 128;
const NEUTRON_RADIUS = 12;
const URANIUM_RADIUS = 24;

const k = kaplay();

k.loadRoot("./"); 
k.loadSprite("crab", "sprites/crab.png");

k.onClick(() => k.addKaboom(k.mousePos()));

function getRndVector({ min_angle, max_angle } = { min_angle: 0, max_angle: 2*Math.PI }) {
    const angle = Math.random() * (max_angle - min_angle) + min_angle;
    return k.vec2(
        Math.cos(angle),
        Math.sin(angle) 
    );
}

k.scene("main", () => {

    const player = k.add([
        k.sprite("crab"),
        k.pos(BOUNDS_OFFSET, MAP_HEIGHT/2),
        k.area(),
        k.body(),
        { dir: k.vec2(0, 0) },
    ]);

    // add left wall
    add([
        k.rect(MAP_WALL, 2*MAP_WALL + MAP_HEIGHT),
        k.pos(BOUNDS_OFFSET, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add right wall
    add([
        k.rect(MAP_WALL, 2*MAP_WALL + MAP_HEIGHT),
        k.pos(BOUNDS_OFFSET + MAP_WALL + MAP_WIDTH, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add top wall
    add([
        k.rect(MAP_WIDTH, MAP_WALL),
        k.pos(BOUNDS_OFFSET + MAP_WALL, BOUNDS_OFFSET),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    // add bottom wall
    add([
        k.rect(MAP_WIDTH, MAP_WALL),
        k.pos(BOUNDS_OFFSET + MAP_WALL, BOUNDS_OFFSET + MAP_WALL + MAP_HEIGHT),
        k.anchor("topleft"),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0)
    ]);

    let neutron = k.add([
        k.pos(0, 50),
        // k.pos(
        //     getRndInteger(0, window.screen.width), 
        //     getRndInteger(0, window.screen.height)
        // ),
        k.circle(NEUTRON_RADIUS),
        k.area(),
        k.color(0, 0, 0),
        { dir: k.vec2(1, 0) },
        // { dir: k.vec2(
        //     getRndInteger(-1, 1), 
        //     getRndInteger(-1, 1)) 
        // },
        "neutron"
    ]);

    let uranium = k.add([
        k.pos(300, 50),
        k.circle(URANIUM_RADIUS),
        k.area(),
        k.color(0, 0, 255),
        "uranium"
    ]);

    function move_player() {
        let dir = k.vec2(0, 0);

        if (k.isKeyDown("a")) dir.x -= 1;
	    if (k.isKeyDown("d")) dir.x += 1;
	    if (k.isKeyDown("w")) dir.y -= 1;
	    if (k.isKeyDown("s")) dir.y += 1;

        dir = dir.unit();
        player.dir = dir;
        player.move(player.dir.scale(SPEED));
    }

    k.onUpdate(() => {
        move_player();
    })

    k.onUpdate("neutron", (neutron) => {
        neutron.move(neutron.dir.scale(300));
    });

    k.onCollide("neutron", "uranium", (neutron, uranium, collision) => {
        // Spawn two neutrons with fully random directions
        for (let i = 0; i < 2; i++) {
            k.add([
                k.pos(uranium.pos),
                k.circle(NEUTRON_RADIUS),
                k.area(),
                k.color(0, 0, 0),
                { dir: getRndVector() },
                "neutron"
            ]);
        }

        // Spawn a single neutron with a direction based on the original
        const angle = Math.atan2(neutron.dir.y, neutron.dir.x);
        k.add([
            k.pos(uranium.pos),
            k.circle(NEUTRON_RADIUS),
            k.area(),
            k.color(0, 0, 0),
            { 
                dir: getRndVector({
                    min_angle: angle - Math.PI / 12,
                    max_angle: angle + Math.PI / 12
                }) 
            },
            "neutron"
        ]);

        k.add([
            k.pos(uranium.pos),
            k.circle(URANIUM_RADIUS),
            k.area(),
            k.color(128, 128, 128),
            "docile"
        ]);

        neutron.destroy();
        uranium.destroy();
    });
});

k.go("main");
