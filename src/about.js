/**
 * Populate CMS Data from an external API.
 */
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  'cmsfilter',
  async (filtersInstances) => {
    console.log(filtersInstances);
    // Get the filters instance
    const [filtersInstance] = filtersInstances;

    // Get the list instance
    const { listInstance } = filtersInstance;

    // Save a copy of the template
    const [firstItem] = listInstance.items;
    const itemTemplateElement = firstItem.element;

    // Fetch external data
    const products = await fetchProducts();

    console.log(products);

    // Remove existing items
    listInstance.clearItems();

    // Create the new items
    const newItems = products.jobs.map((product) => createItem(product, itemTemplateElement));

    // Populate the list
    await listInstance.addItems(newItems);

    // Sync the CMSFilters instance with the newly created filters
    filtersInstance.storeFiltersData();

    // Show the list
    document.querySelector('[job-list]').style.opacity = '1';
  },
]);

/**
 * Fetches fake products from Fake Store API.
 * @returns An array of Product.
 */
const fetchProducts = async () => {
  try {
    const response = await fetch(
      'https://boards-api.greenhouse.io/v1/boards/togetherai/jobs?content=true'
    );
    const data = await response.json();

    return data;
  } catch (error) {
    return [];
  }
};

/**
 * Creates an item from the template element.
 * @param product The product data to create the item from.
 * @param templateElement The template element.
 *
 * @returns A new Collection Item element.
 */
const createItem = (product, templateElement) => {
  // Clone the template element
  const newItem = templateElement.cloneNode(true);

  // Query inner elements
  const label = newItem.querySelector('[data-label]');
  const title = newItem.querySelector('[data-heading]');
  const location = newItem.querySelector('[data-location]');
  const link = newItem.querySelector('[data-button]');

  // Populate inner elements
  if (label) label.textContent = product.departments[0].name;
  if (title) title.textContent = product.title;
  if (location) location.textContent = product.location.name;
  if (link) {
    link.setAttribute('href', product.absolute_url);
    link.target = '_blank'; // Open in a new tab
  }

  return newItem;
};
