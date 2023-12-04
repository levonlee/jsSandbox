interface Contact {
    id: number;
    name: string;
    birthDate?: Date;
}

let myContact: Contact = {
    id: 123,
    name: "My Name"
}

interface ContactWithAddress extends Address  {
    id: number;
    name: string;
    birthDate?: Date;
}

interface Address {
    street: string;
    province: string;
    zip: string;
}

export {}