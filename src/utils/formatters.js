/**
 * Format a date string to a human-readable format
 * 
 * @param {string} dateString - Date string to format
 * @param {string} format - Format string (optional)
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, format = 'long') => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        if (format === 'short') {
            return date.toLocaleDateString();
        }

        if (format === 'year') {
            return date.getFullYear().toString();
        }

        // Default: long format
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * Format a person's name (first name + last name)
 * 
 * @param {Object} person - Person object
 * @returns {string} - Formatted name
 */
export const formatPersonName = (person) => {
    if (!person || !person.data) return '';

    const firstName = person.data['first name'] || '';
    const lastName = person.data['last name'] || '';

    return `${firstName} ${lastName}`.trim();
};

/**
 * Format a location string (city, country)
 * 
 * @param {string} location - Location string
 * @returns {string} - Formatted location
 */
export const formatLocation = (location) => {
    if (!location) return '';

    // Split by comma if present
    const parts = location.split(',');

    if (parts.length === 1) {
        return location;
    }

    // Format as "City, Country"
    return parts.map(part => part.trim()).join(', ');
};

/**
 * Format a phone number
 * 
 * @param {string} phone - Phone number string
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // If not standard format, return as is
    return phone;
};

/**
 * Format relationship text
 * 
 * @param {string} relationType - Type of relationship
 * @param {Object} person - Related person object
 * @returns {string} - Formatted relationship text
 */
export const formatRelationship = (relationType, person) => {
    if (!person) return '';

    const name = formatPersonName(person);

    switch (relationType) {
        case 'father':
            return `Father of ${name}`;
        case 'mother':
            return `Mother of ${name}`;
        case 'spouse':
            return `Spouse of ${name}`;
        case 'child':
            return `Child of ${name}`;
        default:
            return `Related to ${name}`;
    }
};

/**
 * Format work information
 * 
 * @param {string} work - Work string
 * @returns {string} - Formatted work info
 */
export const formatWork = (work) => {
    if (!work) return '';

    // If contains comma, assume format is "Company, Location"
    if (work.includes(',')) {
        const [company, location] = work.split(',').map(part => part.trim());
        return `${company} in ${location}`;
    }

    return work;
};