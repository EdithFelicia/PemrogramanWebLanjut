// 4. Import dog env dari env.js
import dog_env from './env.js';

// Deklarasi
// 5. Deklarasi variable savedPetList dengan getItem dari localStorage
// Referensi : https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
const savedPetList = localStorage.getItem('savedPetList');
// 6. JSON parse savedPetList karena local storage menyimpan value string
const petList = JSON.parse(savedPetList) || []; // Menggunakan '|| []' sebagai fallback jika data tidak ada

// 7. Buat instance untuk suatu search param (untuk pagination)
// Referensi:  https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams dengan parameter window location search saat ini
const searchParams = new URLSearchParams(window.location.search);
// 8. Ambil nilai dari suatu search param key bernama "page", default nilai = 1. Untuk pengesetan dilakukan dibawah dipoin 18
const currentPage = searchParams.get('page') || 1;


// API Call
// 9. Buat suatu fungsi bernama getBreedsImage untuk melakukan pemanggilan API 
// menggunakan async await
// API URL : {dog_env.endpoint}/v1/images/search
// Query param : 
// a. include_categories = true, 
// b. include_breeds = true,
// c. has_breeds = true, 
// d. order=sesuaikan nilai sortBy dari parameter fungsi
// e. page = sesuaikan nilai dari currentPage
// f. limit = 10
// Method : GET
// headers : menyesuaikan dengan documentasi yang disediakan
// 9a. set sortBy dengan nilai default ascending (check di API docs bagaimana nilai ascending dan descending di definisikan pada query parameter order)
const getBreedsImage = async (sortBy = 'asc', currentPage) => {
  try {
    // API URL
    const apiUrl = `${dog_env.endpoint}v1/images/search`;

    // Query Parameters
    const queryParams = new URLSearchParams({
      include_categories: true,
      include_breeds: true,
      has_breeds: true,
      order: sortBy,
      page: currentPage,
      limit: 10,
    });

    // Method: GET
    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-api-key': dog_env.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

// 10. Buat fungsi fetchImage untuk melakukan pemanggilan fungsi getBreedsImage sesuai sortBy yang dikirim
// supaya nilainya lebih dinamis
const fetchImage = (sortBy) => {
  // 10a. panggil fungsi getBreedsImage berisi parameter sortBy dengan menggunakan promise then. 
  getBreedsImage(sortBy)
    .then((data) => {
      // ketika resolve, maka set nilai ke localstorage dengan pasangan key: petList dan value: hasil nilai yang diresolve (jangan lupa valuenya di JSON.stringify)
      // 10a. Set nilai ke localStorage dengan pasangan key: petList dan value: hasil nilai yang diresolve
      // Pastikan value di-JSON.stringify
      localStorage.setItem('savedPetList', JSON.stringify(data));
      
      // 10b. Panggil fungsi render component (seperti pertemuan sebelumnya) dengan parameter value
      renderComponent(data);
    })
    .catch((error) => {
      // Handle errors if the API call fails
      console.error('Error:', error);
    });
};

fetchImage();

// 11. Definisikan selector untuk dropdown menu, search form dan search input element
const dropdownElement = document.querySelector('.dropdownMenu');
const formElement = document.querySelector('.searchForm');
const searchInputElement = document.querySelector('.searchInput');

// pagination
// 12. Definisikan selector untuk pagination
const prevPage =  document.querySelector('.prevPagination');
const pageOne = document.querySelector('.pageOne');
const pageTwo = document.querySelector('.pageTwo');
const pageThree = document.querySelector('.pageThree');
const nextPage = document.querySelector('.nextPagination');


// 13. Buat fungsi bernama petCardComponent untuk merender nilai dari hasil fetch data di endpoint
const PetCardComponent = (pet) => {
  // 13a. tampilkan nilai dari breeds dari array ke 0
  const breed = pet.breeds[0];
  // 13b. tampilkan hasil nilai dibawah ini sesuai dengan response yang didapatkan
  return `<div class="card my-3 mx-2" style="width: 20%">
    <img height="300" style="object-fit: cover" class="card-img-top" src=${pet.url} alt="Card image cap" />
    <div class="card-body">
      <h5 class="card-title d-inline">${breed.name}</h5>
      <p class="card-text">
        ${breed.temperament || 'No description available'}
      </p>
      <p>${breed.breed_group}</p>
      <span class="badge badge-pill badge-info">${breed.life_span}</span>
      <span class="badge badge-pill badge-warning">Weight: ${breed.weight.metric}</span>
      <span class="badge badge-pill badge-danger">Height: ${breed.height.metric}</span>
    </div>
  </div>`
};

const renderComponent = (filteredPet) => {
  document.querySelector(".petInfo").innerHTML = filteredPet
    .map((pet) => PetCardComponent(pet))
    .join("");
};

// 14. buat fungsi sortPetById sesuai dengan key yang dipilih
const sortPetById = (key) => {
  if (key === "ascending") {
    fetchImage("asc"); // panggil fungsi fetchImage dengan nilai yang ditentukan pada dokumentasi API sama pada poin 9a.
  }
  if (key === "descending") {
    fetchImage("desc"); // panggil fungsi fetchImage dengan nilai yang ditentukan pada dokumentasi API sama pada poin 9a.
  }
};

// 15. searchPetByKey digunakan untuk melakukan search tanpa memanggil API, tetapi langsung
// dari nilai petList
const searchPetByKey = (key) => {
  // 15a. mengembalikan filter dari petList sesuai dengan key yang diketikkan
  return petList.filter((pet) => {
    // Pencarian berdasarkan nama breed (jika breed ada dalam data pet).
    if (pet.breeds[0].name.toLowerCase().includes(key.toLowerCase())) {
      return true;
    }
    return false;
  });
};

dropdownElement.addEventListener("change", (event) => {
  // 16. Buat fungsi untuk sorting
  event.preventDefault();
  const selectedValue = dropdownElement.value;
  // 16a. Panggil fungsi sort dengan parameter value di atas
  sortPetById(selectedValue);
});

formElement.addEventListener("submit", (event) => {
  // 17. Buat fungsi untuk melakukan search
  event.preventDefault();
  const selectedValue = searchInputElement.value.toLowerCase();
  const filteredPet = searchPetByKey(selectedValue);
  // 17a. panggil fungsi untuk merender komponen dengan parameter:
  // - filteredPet : ketika length filteredPet lebih dari 0
  // - petList: ketika length filteredPet = 0
  renderComponent(filteredPet.length > 0 ? filteredPet : petList);
});

// 18. FUngsi redirectTo untuk pagination
const redirectTo = (page) => {
  // 18a. set searchparam "page" dengan nilai parameter page diatas
  searchParams.set('page', page);
  // 18b. redirect dengan search param yang sudah didefinisikan
  window.location.search = searchParams.toString();
};

prevPage.addEventListener("click", (event) => {
  event.preventDefault();
// 19. jika currentPage > 1 redirect ke current page - 1 (jangan lupa parameter di parse ke number)
// dengan memanggil fungsi redirect To, else redirect ke halaman 1
  if (currentPage > 1) {
    const nextPageNumber = parseInt(currentPage) - 1;
    redirectTo(nextPageNumber);
  } else {
    redirectTo(1);
  }
});

pageOne.addEventListener("click", (event) => {
  event.preventDefault();
  // 20. memanggil fungsi redirectTo ke halaman 1
  redirectTo(1);
});

pageTwo.addEventListener("click", (event) => {
  event.preventDefault();
  // 21. memanggil fungsi redirectTo ke halaman 2
  redirectTo(2);
});

pageThree.addEventListener("click", (event) => {
  event.preventDefault();
  // 22. memanggil fungsi redirectTo ke halaman 3
  redirectTo(3);
});

nextPage.addEventListener("click", (event) => {
  event.preventDefault();
  // 23. memanggil redirectTo ke page currentPage + 1 (jangan lupa diparse jadi number)
  const nextPageNumber = parseInt(currentPage) + 1;
  redirectTo(nextPageNumber);
});
