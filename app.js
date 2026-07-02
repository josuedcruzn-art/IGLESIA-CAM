// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');
const videosGrid = document.getElementById('videosGrid');
const filterTabs = document.querySelectorAll('.filter-tab');
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalOverlay = document.getElementById('modalOverlay');
const mainVideoPlayer = document.getElementById('mainVideoPlayer');
const modalVideoTitle = document.getElementById('modalVideoTitle');
const modalVideoDesc = document.getElementById('modalVideoDesc');
const featuredPlayBtn = document.getElementById('featuredPlayBtn');
const toast = document.getElementById('toast');

// Mobile Nav Toggle
if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('active');
    
    // Animate menu toggle bars
    const spans = menuToggle.querySelectorAll('span');
    if (mobileNav.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Close mobile nav when clicking a link
  mobileNav.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      const spans = menuToggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });
}

// Navigation Active State Highlights
const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
window.addEventListener('scroll', () => {
  let current = 'inicio';
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 120) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Clipboard copying helper
window.copyText = function(elementId) {
  const textEl = document.getElementById(elementId);
  if (!textEl) return;
  
  const text = textEl.textContent.replace(/\s+/g, ''); // strip formatting space for actual copying
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copiado al portapapeles');
  }).catch(err => {
    console.error('Error copying text: ', err);
    showToast('Error al copiar');
  });
};

// Video Library Management
let allVideos = [];
let activeFilter = 'all';

async function fetchVideos() {
  try {
    // Relative PHP endpoint call
    const res = await fetch('api/videos.php');
    if (!res.ok) throw new Error('Network error fetching videos');
    allVideos = await res.json();
    renderVideos(allVideos, 'all');
  } catch (err) {
    console.error(err);
    videosGrid.innerHTML = `
      <div class="empty-state">
        <p>No pudimos cargar la mediateca en este momento. Inténtalo más tarde.</p>
      </div>
    `;
  }
}

function renderVideos(videos, filter) {
  videosGrid.innerHTML = '';
  
  const filtered = filter === 'all' 
    ? videos 
    : videos.filter(v => v.category === filter);

  if (filtered.length === 0) {
    videosGrid.innerHTML = `
      <div class="empty-state">
        <svg style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--color-text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
        <p>Aún no hay videos en esta categoría. ¡Sube el primero en el panel de carga!</p>
      </div>
    `;
    return;
  }

  filtered.forEach(video => {
    const card = document.createElement('div');
    card.className = `video-card category-${video.category}`;
    
    const formattedDate = new Date(video.date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const isClip = video.category === 'clip';
    const durationLabel = isClip ? 'Clip Corto' : 'Mensaje';

    card.innerHTML = `
      <div class="card-thumb-container">
        <span class="card-badge">${isClip ? 'Clip' : 'Sermón'}</span>
        <img class="card-thumbnail" src="${video.thumbnailUrl}" alt="${video.title}" loading="lazy">
        <div class="card-play-overlay">
          <svg class="card-play-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHTML(video.title)}</h3>
        <p class="card-desc">${escapeHTML(video.description || 'Sin descripción.')}</p>
        <div class="card-footer">
          <span>${durationLabel}</span>
          <span>${formattedDate}</span>
        </div>
      </div>
    `;

    // Click handler to play video
    card.querySelector('.card-thumb-container').addEventListener('click', () => {
      openVideoPlayer(video);
    });

    videosGrid.appendChild(card);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Media gallery filter events
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderVideos(allVideos, activeFilter);
  });
});

// Video Modal Player Control
function openVideoPlayer(video) {
  modalVideoTitle.textContent = video.title;
  modalVideoDesc.textContent = video.description || '';
  mainVideoPlayer.src = video.videoUrl; // Relative path already
  videoModal.classList.add('active');
  videoModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Lock background scrolling
}

function closeVideoPlayer() {
  videoModal.classList.remove('active');
  videoModal.setAttribute('aria-hidden', 'true');
  mainVideoPlayer.pause();
  mainVideoPlayer.src = '';
  document.body.style.overflow = ''; // Restore scroll
}

if (modalClose) modalClose.addEventListener('click', closeVideoPlayer);
if (modalOverlay) modalOverlay.addEventListener('click', closeVideoPlayer);

// Play featured video on click
if (featuredPlayBtn) {
  featuredPlayBtn.addEventListener('click', () => {
    const featuredVideo = allVideos.find(v => v.id === "default-sermon-1") || allVideos[0];
    if (featuredVideo) {
      openVideoPlayer(featuredVideo);
    }
  });
}

// Esc Key closes video player
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && videoModal.classList.contains('active')) {
    closeVideoPlayer();
  }
});

// Donation Module Interactive Tabs
const tabBank = document.getElementById('tabBank');
const tabElectronic = document.getElementById('tabElectronic');
const paneBank = document.getElementById('paneBank');
const paneElectronic = document.getElementById('paneElectronic');

if (tabBank && tabElectronic) {
  tabBank.addEventListener('click', () => {
    tabBank.classList.add('active');
    tabElectronic.classList.remove('active');
    paneBank.classList.add('active');
    paneElectronic.classList.remove('active');
  });

  tabElectronic.addEventListener('click', () => {
    tabElectronic.classList.add('active');
    tabBank.classList.remove('active');
    paneElectronic.classList.add('active');
    paneBank.classList.remove('active');
  });
}

// Payment method toggles card info display
const paymentMethodSelect = document.getElementById('paymentMethod');
const cardDetailsMock = document.getElementById('cardDetailsMock');

if (paymentMethodSelect && cardDetailsMock) {
  paymentMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Tarjeta de Crédito') {
      cardDetailsMock.style.display = 'block';
      toggleCardRequired(true);
    } else {
      cardDetailsMock.style.display = 'none';
      toggleCardRequired(false);
    }
  });
}

function toggleCardRequired(required) {
  document.getElementById('cardNumber').required = required;
  document.getElementById('cardExpiry').required = required;
  document.getElementById('cardCvc').required = required;
}

// Formatting helpers for card inputs
const cardNumberInput = document.getElementById('cardNumber');
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    e.target.value = formatted.substring(0, 19);
  });
}

const cardExpiryInput = document.getElementById('cardExpiry');
if (cardExpiryInput) {
  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
      e.target.value = value;
    }
  });
}

// Electronic Donation Form Submit Handler
const electronicDonationForm = document.getElementById('electronicDonationForm');
const donationStatusOverlay = document.getElementById('donationStatusOverlay');
const statusContent = document.getElementById('statusContent');

if (electronicDonationForm) {
  electronicDonationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const donorName = document.getElementById('donorName').value;
    const email = document.getElementById('donorEmail').value;
    const amount = document.getElementById('donationAmount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Show spinner overlay
    donationStatusOverlay.classList.add('active');
    statusContent.innerHTML = `
      <div class="spinner large"></div>
      <p class="status-msg">Procesando donación segura por $${amount} USD...</p>
    `;

    try {
      // Relative PHP script request
      const response = await fetch('api/donations.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ donorName, email, amount, paymentMethod })
      });

      // Wait 1.8 seconds to simulate payment processing bank delays
      await new Promise(r => setTimeout(r, 1800));

      if (!response.ok) throw new Error('Transaction failed');
      const data = await response.json();
      
      if (data.success) {
        const donationRef = data.donation.id;
        const formattedDate = new Date(data.donation.date).toLocaleString('es-ES');
        
        // Show success confirmation screen
        statusContent.innerHTML = `
          <div class="success-circle">✓</div>
          <h3 style="color: var(--color-success); font-family: var(--font-title); font-size: 1.5rem;">¡Ofrenda Confirmada!</h3>
          <p style="color: var(--color-text-secondary); max-width: 320px; font-size: 0.9rem;">
            Muchas gracias por sembrar en nuestro ministerio. Tu transacción se ha completado con éxito.
          </p>
          
          <div class="receipt-box">
            <div class="receipt-title">RECIBO DE DONACIÓN</div>
            <div class="receipt-row"><span>Ref:</span> <span>${donationRef}</span></div>
            <div class="receipt-row"><span>Donante:</span> <span>${escapeHTML(donorName)}</span></div>
            <div class="receipt-row"><span>Método:</span> <span>${paymentMethod}</span></div>
            <div class="receipt-row"><span>Fecha:</span> <span>${formattedDate}</span></div>
            <div class="receipt-row" style="border-top: 1px dashed rgba(255,255,255,0.1); margin-top: 0.5rem; padding-top: 0.5rem; font-weight: 700; color: var(--color-gold);">
              <span>Monto:</span> <span>$${parseFloat(amount).toFixed(2)} USD</span>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-outline" onclick="printReceipt()">Imprimir Recibo</button>
            <button class="btn btn-primary" id="btnFinishDonation">Cerrar</button>
          </div>
        `;

        document.getElementById('btnFinishDonation').addEventListener('click', () => {
          donationStatusOverlay.classList.remove('active');
          electronicDonationForm.reset();
          if (cardDetailsMock) cardDetailsMock.style.display = 'none';
        });
      } else {
        throw new Error(data.error || 'Server rejected transaction');
      }

    } catch (err) {
      console.error(err);
      statusContent.innerHTML = `
        <div style="color: #dc2626; font-size: 3rem; font-weight: bold;">✕</div>
        <h3 style="color: #dc2626; font-family: var(--font-title);">Error en la transacción</h3>
        <p style="color: var(--color-text-secondary); max-width: 300px;">
          No pudimos procesar tu donación electrónica. Por favor, verifica tus datos bancarios y vuelve a intentarlo.
        </p>
        <button class="btn btn-primary" onclick="dismissDonationError()">Volver a intentar</button>
      `;
    }
  });
}

window.dismissDonationError = function() {
  donationStatusOverlay.classList.remove('active');
};

window.printReceipt = function() {
  const receipt = document.querySelector('.receipt-box').outerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Recibo de Donación - Iglesia Gracia y Verdad</title>
        <style>
          body { font-family: monospace; padding: 40px; display: flex; justify-content: center; }
          .receipt-box { border: 1px solid #000; padding: 20px; width: 320px; }
          .receipt-title { text-align: center; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${receipt}
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Video Upload Form Handlers
const videoFileInput = document.getElementById('videoFile');
const videoFileLabel = document.getElementById('videoFileLabel');
const thumbnailFileInput = document.getElementById('thumbnailFile');
const thumbnailFileLabel = document.getElementById('thumbnailFileLabel');
const uploadVideoForm = document.getElementById('uploadVideoForm');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressContainer = document.getElementById('progressContainer');

if (videoFileInput) {
  videoFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      videoFileLabel.textContent = e.target.files[0].name;
      videoFileLabel.style.color = 'var(--color-gold)';
    } else {
      videoFileLabel.textContent = 'Seleccionar .mp4, .mov, etc.';
      videoFileLabel.style.color = '';
    }
  });
}

if (thumbnailFileInput) {
  thumbnailFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      thumbnailFileLabel.textContent = e.target.files[0].name;
      thumbnailFileLabel.style.color = 'var(--color-gold)';
    } else {
      thumbnailFileLabel.textContent = 'Seleccionar .jpg, .png, etc.';
      thumbnailFileLabel.style.color = '';
    }
  });
}

if (uploadVideoForm) {
  uploadVideoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDesc').value;
    const category = document.getElementById('videoCategory').value;
    const videoFile = videoFileInput.files[0];
    const thumbnailFile = thumbnailFileInput.files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);

    // Show Progress bar container
    progressContainer.style.display = 'flex';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';

    const xhr = new XMLHttpRequest();
    // Point to relative PHP upload handler
    xhr.open('POST', 'api/videos.php', true);

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressPercent.textContent = percentComplete + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            if (response.video) {
              allVideos.unshift(response.video);
              renderVideos(allVideos, activeFilter);
            }

            const toastMessage = response.warning
              ? '¡Video subido con éxito! ' + response.warning
              : '¡Video subido con éxito!';
            showToast(toastMessage);
            uploadVideoForm.reset();
            videoFileLabel.textContent = 'Seleccionar .mp4, .mov, etc.';
            videoFileLabel.style.color = '';
            thumbnailFileLabel.textContent = 'Seleccionar .jpg, .png, etc.';
            thumbnailFileLabel.style.color = '';
            progressContainer.style.display = 'none';
          } else {
            showToast('Error al procesar el archivo: ' + response.error);
          }
        } catch (err) {
          showToast('Error al parsear respuesta del servidor');
          console.error(xhr.responseText);
        }
      } else {
        showToast('Error en la comunicación con el servidor');
      }
    });

    xhr.addEventListener('error', () => {
      showToast('Error de red al subir archivo');
    });

    xhr.send(formData);
  });
}

// Initial Booting Fetch
fetchVideos();
