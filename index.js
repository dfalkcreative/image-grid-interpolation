import Color from "colorjs.io"

/**
 * The average color calculator.
 */
const ColorAverage = new FastAverageColor();


/**
 * Listing class.
 */
class Listing {
    /**
     * Listing constructor.
     */
    constructor(position, image) {
        this.position = position;
        this.image = image;
    }


    /**
     * Returns the position.
     */
    getPosition() {
        return this.position;
    }


    /**
     * Returns the image resource.
     *
     * @returns {*}
     */
    getImage() {
        return this.image;
    }
}


/**
 * Grid class.
 */
class Grid {
    /**
     * Grid constructor.
     */
    constructor() {
        this.width = 3;
        this.scale = 50;
        this.height = 500;

        // Prepare the canvas.
        this.element = document.querySelector('#canvas');
        this.element.width = this.getWidth() * this.getScale();
        this.element.height = this.getHeight() * this.getScale();
        this.getContext().imageSmoothingEnabled = false;

        // Determine are series.
        this.images = [];
        this.listings = [];
        this.excluded = [];
        this.onLoad = () => {
        };
    }


    /**
     * Adds an excluded path to avoid re-using.
     *
     * @param path
     * @returns {this}
     */
    addExclusion(path) {
        this.excluded.push(path);

        return this;
    }


    /**
     * Used to register multiple exclusions.
     *
     * @param paths
     * @returns {this}
     */
    addExclusions(paths) {
        for (let i = 0; i < paths.length; i++) {
            this.addExclusion(paths[i])
        }

        return this;
    }


    /**
     * Returns the excluded paths.
     *
     * @returns {*}
     */
    getExcluded() {
        return this.excluded;
    }


    /**
     * Indicates whether or not an image is being excluded.
     *
     * @param path
     * @returns {boolean}
     */
    isExcluded(path) {
        return this.getExcluded()
            .includes(path);
    }


    /**
     * Interpolates images between designated listings.
     */
    interpolate() {
        let listings = this.getListings().sort((a, b) => (a.getPosition() > b.getPosition()) ? 1 : -1);

        // Ignore if we don't have enough data.
        if (listings.length <= 1) {
            return;
        }

        // Interpolate between each listing.
        for (let i = 1; i < listings.length; i++) {
            let current = listings[i];
            let previous = listings[i - 1];

            // Determine the tween gradient.
            let color = new Color(previous.getImage().getHex());
            let steps = color.steps(current.getImage().getHex(), {
                space: "lch",
                outputSpace: "srgb",
                steps: current.getPosition() - previous.getPosition()
            });

            for (let j = 0; j < current.getPosition() - previous.getPosition(); j++) {
                if (!j) {
                    this.addPreview(previous.getImage())
                        .setIndex(previous.getPosition(), previous.getImage().getHex());
                    continue;
                }

                // Find nearest image.
                let nearest = this.getNearestImage(steps[j].hex);

                this.addExclusion(nearest.getPath())
                    .addPreview(nearest)
                    .setIndex(previous.getPosition() + j, nearest.getHex());
            }
        }

        // Handle the ending image.
        let latest = listings[listings.length - 1];

        this.addPreview(latest.getImage())
            .setIndex(latest.getPosition(), latest.getImage().getHex());
    }


    /**
     * Returns the nearest, visually similar image.
     *
     * @param hex
     * @returns {Image}
     */
    getNearestImage(hex) {
        let minimum = 9999.99;
        let nearest = new Image();
        let base = new Color(hex);
        let images = this.getImages();

        for (let i = 0; i < images.length; i++) {
            // Ignore if we're excluding the path.
            if (this.isExcluded(images[i].getPath())) {
                continue;
            }

            let comparator = new Color(images[i].getHex());
            let distance = base.deltaE(comparator, "76");

            // Check for a new minimum. If found, replace the nearest calculated.
            if (distance < minimum) {
                minimum = distance;
                nearest = images[i];
            }
        }

        return nearest;
    }


    /**
     * Assigns the onLoad event.
     */
    setOnLoad(callback) {
        this.onLoad = callback;
    }


    /**
     * Pushes a new preview image.
     *
     * @param image
     * @returns this
     */
    addPreview(image) {
        let column = document.querySelector('#images');

        // The outer element.
        let block = document.createElement('div');
        block.classList.add('container');
        block.style = `background: ${image.getHex()}`;

        // The image element.
        let preview = document.createElement('img');
        preview.src = image.getPath();

        // The wrapper element.
        let wrapper = document.createElement('div');
        wrapper.appendChild(preview);
        block.appendChild(wrapper);
        column.prepend(block);

        return this;
    }


    /**
     * Pings the Grid element to decide whether or not we can call the load event.
     */
    update() {
        let images = this.getImages();

        // Ignore if we don't have any images.
        if (!images.length) {
            return this.onLoad();
        }

        for (let i = 0; i < images.length; i++) {
            if (images[i].getLoading()) {
                return;
            }
        }

        return this.onLoad();
    }


    /**
     * Returns the series of images.
     */
    getImages() {
        return this.images;
    }


    /**
     * Assigns a new image.
     */
    addImage(image) {
        this.images.push(image);
    }


    /**
     * Returns the configured width.
     *
     * @returns {*}
     */
    getWidth() {
        return this.width;
    }


    /**
     * Returns the configured height.
     *
     * @returns {*}
     */
    getHeight() {
        return this.height;
    }


    /**
     * Returns the element.
     *
     * @returns {*}
     */
    getElement() {
        return this.element;
    }


    /**
     * Returns the drawing context.
     *
     * @returns {CanvasRenderingContext2D | WebGLRenderingContext}
     */
    getContext() {
        return this.getElement().getContext('2d');
    }


    /**
     * Returns the scale.
     */
    getScale() {
        return this.scale;
    }


    /**
     * Stores a series of listings.
     *
     * @param listings
     * @returns {this}
     */
    addListings(listings) {
        for (let i = 0; i < listings.length; i++) {
            this.addListing(listings[i]);
        }

        return this;
    }


    /**
     * Registers a new listing.
     *
     * @returns {this}
     */
    addListing(listing) {
        this.addExclusion(listing.getImage().getPath());
        this.listings.push(listing);

        return this;
    }


    /**
     * Assigns the index.
     *
     * @returns {this}
     */
    setIndex(index, color) {
        return this.setBlock(
            index % this.getWidth(),
            Math.floor(index / this.getWidth()),
            color
        );
    }


    /**
     * Assigns a particular index on the canvas.
     *
     * @param x
     * @param y
     * @param color
     * @returns {this}
     */
    setBlock(x, y, color) {
        let context = this.getContext();
        context.fillStyle = color;
        context.fillRect(
            x * this.getScale(),
            y * this.getScale(),
            this.getScale(), this.getScale()
        );

        return this;
    }


    /**
     * Returns an image resource by path.
     *
     * @param path
     * @returns {Image}
     */
    getImageByPath(path) {
        let images = this.getImages();

        for (let i = 0; i < images.length; i++) {
            if (images[i].getPath() === path) {
                return images[i];
            }
        }

        return new Image(0, 0);
    }


    /**
     * Returns the listing series.
     *
     * @returns {[]}
     */
    getListings() {
        return this.listings;
    }
}


/**
 * The color layout.
 */
const Layout = new Grid();


/**
 * Image class.
 */
class Image {
    /**
     * Image constructor.
     *
     * @param path
     */
    constructor(path) {
        this.path = path;
        this.color = [];
        this.isLoading = false;

        // Verify that we have a path.
        if (!this.path) {
            return;
        }

        // Determine the image color information.
        this.isLoading = true;
        let image = document.createElement('img');
        image.src = this.path;
        image.style = 'display: none;';
        image.onload = () => {
            ColorAverage.getColorAsync(image)
                .then(color =>
                    Layout.addImage(this.setColor(color))
                )
                .catch(e => {
                    console.log(e);
                });

            this.isLoading = false;
            Layout.update();
        };

        // Append the image.
        document.body.appendChild(image);
        this.element = image;
    }


    /**
     * Returns the hex color.
     *
     * @returns {*}
     */
    getHex() {
        return this.getColor().hex;
    }


    /**
     * Returns the image path.
     */
    getPath() {
        return this.path;
    }


    /**
     * Indicates whether or not the image is loading.
     */
    getLoading() {
        return this.isLoading;
    }


    /**
     * Returns the internal element.
     *
     * @returns {*}
     */
    getElement() {
        return this.element;
    }


    /**
     * Returns the X coordinate.
     *
     * @returns {*}
     */
    getX() {
        return this.x;
    }


    /**
     * Returns the Y coordinate.
     *
     * @returns {*}
     */
    getY() {
        return this.y;
    }


    /**
     * Assigns the color.
     *
     * @returns {this}
     */
    setColor(color) {
        this.color = color;

        return this;
    }


    /**
     * Returns the calculated color.
     *
     * @returns {*}
     */
    getColor() {
        return this.color;
    }
}

(() => {
    Layout.setOnLoad(() => {
        Layout.addExclusions([
            './images/AAA036.jpg',
            './images/AAA016.jpg',
            './images/DSCF9275.jpg',
            './images/DSCF9498.jpg',
            './images/DSCF9303.jpg',
            './images/DSCF9071.jpg',
            './images/DSCF9318.jpg',
            './images/DSCF9368.jpg',
        ]).addListings([
            new Listing(0, Layout.getImageByPath('./images/DSCF9369.jpg')),
            new Listing(10, Layout.getImageByPath('./images/DSCF9435.jpg')),
            new Listing(20, Layout.getImageByPath('./images/DSCF9500.jpg')),
        ]).interpolate();
    });

    // Load all of the available images.
    fetch("/images.json")
        .then(response => response.json())
        .then(json => {
            json.map((path) => {
                Layout.addImage(
                    new Image(`./images/${path}`)
                );
            })
        });
})();