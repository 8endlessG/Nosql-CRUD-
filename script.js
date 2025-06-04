const firebaseConfig = {
  apiKey: "AIzaSyCKnOlLJNeMzmALZdCPvwfDY8Yi9H8GGeA",
  authDomain: "crud-6beef.firebaseapp.com",
  projectId: "crud-6beef",
  storageBucket: "crud-6beef.firebasestorage.app",
  messagingSenderId: "378475669194",
  appId: "1:378475669194:web:0cb6267370cbea904bf633",
  measurementId: "G-7KMCJRF9T2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const personForm = document.getElementById('personForm');
const nameInput = document.getElementById('name');
const ageInput = document.getElementById('age');
const genderInput = document.getElementById('gender');
const addressInput = document.getElementById('address');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const peopleList = document.getElementById('peopleList');
const personIdInput = document.getElementById('personId');
const toggleTableBtn = document.getElementById('toggleTableBtn');
const dataContainer = document.getElementById('dataContainer');

let editingId = null;
let isTableVisible = false;
const peopleRef = db.collection('people');

document.addEventListener('DOMContentLoaded', function() {
  toggleTableBtn.addEventListener('click', toggleTable);
  personForm.addEventListener('submit', handleFormSubmit);
  cancelBtn.addEventListener('click', cancelEdit);
  
  // Initial render (table starts hidden)
  dataContainer.style.display = 'none';
});

function toggleTable() {
  isTableVisible = !isTableVisible;
  
  if (isTableVisible) {
    dataContainer.style.display = 'block';
    toggleTableBtn.textContent = 'Hide Table';
    renderPeople();
  } else {
    dataContainer.style.display = 'none';
    toggleTableBtn.textContent = 'Show Table';
  }
}

function renderPeople() {
  peopleList.innerHTML = '';
  
  peopleRef.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    peopleList.innerHTML = '';
    
    snapshot.forEach(doc => {
      const person = doc.data();
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${person.name}</td>
        <td>${person.age}</td>
        <td>${person.gender}</td>
        <td>${person.address}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${doc.id}">Edit</button>
          <button class="action-btn delete-btn" data-id="${doc.id}">Delete</button>
        </td>
      `;
      
      peopleList.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDelete);
    });
  }, error => {
    showToast('Error loading data: ' + error.message, 'error');
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = nameInput.value.trim();
  const age = ageInput.value;
  const gender = genderInput.value;
  const address = addressInput.value.trim();

  if (!name || !age || !gender || !address) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    if (editingId !== null) {
      await peopleRef.doc(editingId).update({
        name,
        age,
        gender,
        address,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Person updated successfully!', 'success');
    } else {
      await peopleRef.add({
        name,
        age,
        gender,
        address,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Person added successfully!', 'success');
    }
    
    personForm.reset();
    editingId = null;
    submitBtn.textContent = 'Add Person';
    cancelBtn.style.display = 'none';
    
  } catch (error) {
    console.error("Error: ", error);
    showToast('Operation failed: ' + error.message, 'error');
  }
}

async function handleEdit(e) {
  const id = e.target.getAttribute('data-id');
  
  try {
    const doc = await peopleRef.doc(id).get();
    if (doc.exists) {
      const personToEdit = doc.data();
      nameInput.value = personToEdit.name;
      ageInput.value = personToEdit.age;
      genderInput.value = personToEdit.gender;
      addressInput.value = personToEdit.address;
      personIdInput.value = doc.id;
      
      editingId = doc.id;
      submitBtn.textContent = 'Update Person';
      cancelBtn.style.display = 'inline-block';
      
      showToast('Person loaded for editing', 'info');
      document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
      
      if (!isTableVisible) {
        toggleTable();
      }
    }
  } catch (error) {
    console.error("Error getting document:", error);
    showToast('Failed to load person: ' + error.message, 'error');
  }
}

async function handleDelete(e) {
  const id = e.target.getAttribute('data-id');
  
  if (confirm('Are you sure you want to delete this person?')) {
    try {
      await peopleRef.doc(id).delete();
      showToast('Person deleted successfully!', 'success');
      
      if (editingId === id) {
        personForm.reset();
        editingId = null;
        submitBtn.textContent = 'Add Person';
        cancelBtn.style.display = 'none';
      }
    } catch (error) {
      console.error("Error removing document: ", error);
      showToast('Failed to delete person: ' + error.message, 'error');
    }
  }
}

function cancelEdit() {
  personForm.reset();
  editingId = null;
  submitBtn.textContent = 'Add Person';
  cancelBtn.style.display = 'none';
  showToast('Edit cancelled', 'info');
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  document.body.appendChild(container);
  return container;
}
