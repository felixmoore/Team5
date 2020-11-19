/**
 * Abstract base class for all in-game objects.
 */
class GameObject {
    constructor(x, y, width, height, image) {
        if (this.constructor === GameObject
            || this.constructor === InteractiveObject) {
            throw new TypeError("GameObject is abstract and " +
            "cannot be instantiated.");
        }
        this.x = x;
        this.y = y;
        this.size = {
            width,
            height
        };
        this.image = image;
    }

    /**
     * Still unsure if these methods should be here. Does an object draw itself?
     */
    draw() {
        throw new ReferenceError("Method draw() has not been defined.");
    };

    undraw() {
        throw new ReferenceError("Method undraw() has not been defined.");
    }

    redraw(img) {
        this.image = img;
        this.undraw();
        this.draw();
    }
    /**
     * 
     */
}

class InteractiveObject extends GameObject {
    constructor(x, y, width, height, image) {
        super(x, y, width, height, image);
    }

    /**
     * Can be overidden to provide the different behaviours we need
     */
    interact() {
        throw new ReferenceError("Method interact() has not been defined.");
    }
}

class PortalObject extends InteractiveObject {
    constructor(x, y, width, height, image, portal) {
        super(x, y, width, height, image)
        this.linkedTo = portal; // connected PortalObject coordinates
    }

    test() {
        console.log("TEST!");
    }

    /**
     * Example, interacting with the portal would return the coordinates
     * of the linked portal, the player can then be transported there
     */
    interact() {
        return { 
            x: this.linkedTo.x,
            y: this.linkedTo.y
        }
    }
}