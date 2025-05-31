document.getElementById('joinBtn').addEventListener('click', () => {
  const name = document.getElementById('userName').value;
  const role = document.getElementById('userRole').value;
  
  if(!name) {
    alert('Please enter your name');
    return;
  }
  
  // Store username globally
  window.userName = name;
  
  document.querySelector('.role-selector').classList.add('hidden');
  document.querySelector('.container').classList.remove('hidden');
  
  if(role === 'teacher') {
    document.getElementById('shareScreenBtn').classList.remove('hidden');
  }
  
  initRTC(name, role);
});