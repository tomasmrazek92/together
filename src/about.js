// Global storage
let globalJobs = [];
let globalDepartments = [];
let templateElement = null;

// Initialize FSAttributes
window.fsAttributes = window.fsAttributes || [];

// Load all the data first
async function loadAllData() {
  try {
    // console.log('1. Loading API data...');
    const products = await fetchProducts();
    globalJobs = products.jobs;

    // Extract unique departments
    const departments = new Set();
    globalJobs.forEach((job) => {
      if (job.departments && job.departments.length > 0) {
        departments.add(job.departments[0].name);
      }
    });
    globalDepartments = Array.from(departments);

    // console.log('2. Data loaded:', { jobs: globalJobs.length, departments: globalDepartments });
    return true;
  } catch (error) {
    console.error('Error loading data:', error);
    return false;
  }
}

// Main initialization sequence
async function initializeSequence() {
  try {
    // 1. Load the data first
    await loadAllData();

    // 2. Manually initialize CMS Load
    // console.log('3. Initializing CMS Load...');
    await window.fsAttributes.cmsload.init();

    // 3. Set up CMS Load handler
    window.fsAttributes.push([
      'cmsload',
      async (listInstances) => {
        // console.log('4. CMS Load callback triggered');
        const [listInstance] = listInstances;

        // Save template
        const [firstItem] = listInstance.items;
        templateElement = firstItem.element.cloneNode(true);

        // Clear and create new items
        listInstance.clearItems();

        const newItems = globalJobs.map((product) => createItem(product, templateElement));

        // Update items
        await listInstance.addItems(newItems);

        // Update filter menu
        updateFilterMenu(globalDepartments);

        // 4. Initialize CMS Filter
        // console.log('5. Initializing CMS Filter...');
        await window.fsAttributes.cmsfilter.init();

        // Set up CMS Filter handler
        window.fsAttributes.push([
          'cmsfilter',
          (filterInstances) => {
            // console.log('6. CMS Filter initialized');
            const [filterInstance] = filterInstances;
          },
        ]);

        $("input[type='radio'][name='filter']").change(function () {
          const section = $(this).closest('section');

          // Remove 'active' class from all labels in this section
          section.find("[fs-cmsfilter-element='clear']").removeClass('fs-cmsfilter_active');

          // Add 'active' class to the parent label of the checked radio button in this section
          section
            .find("input[type='radio'][name='filter']:checked")
            .closest("[fs-cmsfilter-element='clear']")
            .addClass('fs-cmsfilter_active');
        });

        // Show content
        document.querySelector('[job-list]').style.opacity = '1';
      },
    ]);
  } catch (error) {
    console.error('Error in initialization sequence:', error);
  }
}

/**
 * Updates the filter menu with new department options
 */
function updateFilterMenu(departments) {
  const filterMenu = document.querySelector('[fs-cmsstatic-element="list"]');
  if (!filterMenu) return;

  filterMenu.innerHTML = '';

  departments.forEach((dept, index) => {
    const listItem = document.createElement('div');
    listItem.className = 'filters-item w-dyn-item';
    listItem.setAttribute('role', 'listitem');

    listItem.innerHTML = `
      <label data-element="filter" class="tab w-radio">
        <input type="radio" 
          data-name="filter" 
          id="radio-2-${index}-${index}" 
          name="filter" 
          class="w-form-formradioinput hide w-radio-input" 
          value="${dept}">
        <span fs-cmsfilter-field="category" 
          class="text-size-navigation w-form-label" 
          for="radio-2">${dept}</span>
      </label>
    `;

    filterMenu.appendChild(listItem);
  });
}

/**
 * Fetches jobs from the API
 */
async function fetchProducts() {
  try {
    const response = await fetch(
      'https://boards-api.greenhouse.io/v1/boards/togetherai/jobs?content=true'
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { jobs: [] };
  }
}

/**
 * Creates an item from the template element
 */
function createItem(product, templateElement) {
  const newItem = templateElement.cloneNode(true);

  const label = newItem.querySelector('[data-label]');
  const title = newItem.querySelector('[data-heading]');
  const location = newItem.querySelector('[data-location]');
  const link = newItem.querySelector('[data-button]');

  if (label) label.textContent = product.departments[0].name;
  if (title) title.textContent = product.title;
  if (location) location.textContent = product.location.name;
  if (link) {
    link.setAttribute('href', product.absolute_url);
    link.target = '_blank';
  }

  return newItem;
}

// Start the sequence
initializeSequence();
