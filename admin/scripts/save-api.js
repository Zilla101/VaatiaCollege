// Save section changes - NOW WITH REAL API CALL!
window.saveSectionChanges = async (sectionName) => {
    const messages = {
        // Index.html sections
        hero: '✅ Hero section updated successfully!',
        about: '✅ About section updated successfully!',
        contact: '✅ Contact information updated successfully!',

        // Common sections
        header: '✅ Page header updated successfully!',

        // Admissions sections
        requirements: '✅ Admission requirements updated successfully!',
        application: '✅ Application process updated successfully!',

        // Boarding sections
        facilities: '✅ Boarding facilities updated successfully!',
        meals: '✅ Meal plan information updated successfully!',

        // Activity-based sections
        activities: '✅ Activities information updated successfully!',

        // Pricing sections
        pricing: '✅ Pricing information updated successfully!',
        payment: '✅ Payment options updated successfully!',

        // Skills sections
        skills: '✅ Skills programs updated successfully!',

        // Students sections
        students: '✅ Student information updated successfully!'
    };

    // Get values from inputs
    const values = {};
    const sectionInputs = document.querySelectorAll(`input[id^="${sectionName}-"], textarea[id^="${sectionName}-"]`);
    sectionInputs.forEach(input => {
        values[input.id] = input.value;
    });

    console.log(`💾 Saving ${sectionName} section:`, values);

    // Get the current page from the modal title
    const modalTitle = document.getElementById('modal-title');
    const pageMatch = modalTitle?.innerText.match(/Edit Page: (\w+)/);
    const pageName = pageMatch ? pageMatch[1].toLowerCase() + '.html' : 'index.html';

    try {
        // Make API call to save changes
        const response = await fetch('http://localhost:3000/api/save-section', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: pageName,
                section: sectionName,
                data: values
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(messages[sectionName] || `✅ ${sectionName} section saved!`);
            console.log('✅ Save successful:', result);
        } else {
            alert(`⚠️ Save failed: ${result.error}`);
            console.error('❌ Save failed:', result);
        }

    } catch (error) {
        console.error('❌ API Error:', error);
        alert(`❌ Error: Could not connect to server. Make sure the backend is running!\n\nRun: npm start`);
    }
};
