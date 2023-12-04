interface AnimalInterface {
    name: string;
}

interface BearInterface extends AnimalInterface {
    honey: boolean;
}

type AnimalType = {
    name: string;
}

type BearType = AnimalType & {
    honey: boolean;
}

interface Window {
    title: string;
}

interface Window {
    ts: number;
    // title: number // cannot change previously declared field
}

let w: Window = {title: "title", ts: 123};

export {}