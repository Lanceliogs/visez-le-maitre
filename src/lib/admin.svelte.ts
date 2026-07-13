// This thing will be true only if we have a specific local storage token
// But also, it needs to be secured. We'll discuss that later.
let admin = $state(false);

function isAdmin() {
    return admin;
}

export { isAdmin }