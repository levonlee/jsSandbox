// npm i @types/jquery

async function getContact(contactId: number) {
    const resp = await $.ajax({
        url: `/contacts/$(contactId)`,
        dataType: "json"
    })
}