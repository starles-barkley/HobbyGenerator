const HobbyItemList = document.querySelector('#hobbyItemList');

const SetupHobyItems = (data) => {
    if (data.length) {
        let html = '';
        data.forEach(doc => {
            const hobby = doc.data();
            const li = `
            <li class="list-group-item list-group-item-action">
                <h5>${hobby.activity}</h5>
                <p>${hobby.type}</p>
            </li>
            `;
            html += li;
        });

        HobbyItemList.innerHTML = html;
    } else {
        HobbyItemList.innerHTML = '<p class="text-center">Login to view hobbies</p>';
    }
}