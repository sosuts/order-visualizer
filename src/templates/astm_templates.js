const astmTemplates = {
    cbc: {
        name: 'Complete Blood Count (CBC)',
        description: '全血球計算検査オーダー',
        template: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|{timestamp}
P|1||{patient_id}||{patient_name}||{dob}|{sex}|||{address}|||||||||||||||||||||
O|1|{order_number}|{specimen_id}|^^^{test_code}^{test_name}^L||R|{order_datetime}|||||A||||||||||F||||||||
L|1|N`,
        fields: {
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201120000' },
            patient_id: { type: 'text', description: 'Patient ID', example: '12345' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Smith^John^A' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19850315' },
            sex: { type: 'select', options: ['M', 'F', 'U'], description: 'Patient sex' },
            address: { type: 'text', description: 'Patient address', example: '123 Main St^Any City^CA^90210' },
            order_number: { type: 'text', description: 'Order number', example: 'ORD123' },
            specimen_id: { type: 'text', description: 'Specimen ID', example: '12345^001' },
            test_code: { type: 'text', description: 'Test code', example: 'CBC' },
            test_name: { type: 'text', description: 'Test name', example: 'Complete Blood Count' },
            order_datetime: { type: 'datetime', description: 'Order date/time', example: '20231201120000' }
        }
    },
    
    chemistry: {
        name: 'Basic Chemistry Panel',
        description: '基本生化学検査オーダー',
        template: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|{timestamp}
P|1||{patient_id}||{patient_name}||{dob}|{sex}|||{address}|||||||||||||||||||||
O|1|{order_number}|{specimen_id}|^^^{test_code}^{test_name}^L||R|{order_datetime}|||||A||||||||||F||||||||
L|1|N`,
        fields: {
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201120000' },
            patient_id: { type: 'text', description: 'Patient ID', example: '12345' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Johnson^Mary^L' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19900622' },
            sex: { type: 'select', options: ['M', 'F', 'U'], description: 'Patient sex' },
            address: { type: 'text', description: 'Patient address', example: '456 Oak Ave^Some Town^NY^12345' },
            order_number: { type: 'text', description: 'Order number', example: 'ORD456' },
            specimen_id: { type: 'text', description: 'Specimen ID', example: '45678^001' },
            test_code: { type: 'text', description: 'Test code', example: 'CHEM' },
            test_name: { type: 'text', description: 'Test name', example: 'Basic Chemistry Panel' },
            order_datetime: { type: 'datetime', description: 'Order date/time', example: '20231201130000' }
        }
    },

    microbiology: {
        name: 'Microbiology Culture',
        description: '微生物培養検査オーダー',
        template: `H|\\^&|||LIS^Laboratory Information System|||||||P|E 1394-97|{timestamp}
P|1||{patient_id}||{patient_name}||{dob}|{sex}|||{address}|||||||||||||||||||||
O|1|{order_number}|{specimen_id}|^^^{test_code}^{test_name}^L||{priority}|{order_datetime}|||||A||||||||||F||||||||
L|1|N`,
        fields: {
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201120000' },
            patient_id: { type: 'text', description: 'Patient ID', example: '78901' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Davis^Robert^K' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19751203' },
            sex: { type: 'select', options: ['M', 'F', 'U'], description: 'Patient sex' },
            address: { type: 'text', description: 'Patient address', example: '789 Pine St^Another City^TX^67890' },
            order_number: { type: 'text', description: 'Order number', example: 'ORD789' },
            specimen_id: { type: 'text', description: 'Specimen ID', example: '78901^001' },
            test_code: { type: 'text', description: 'Test code', example: 'CULT' },
            test_name: { type: 'text', description: 'Test name', example: 'Bacterial Culture' },
            priority: { type: 'select', options: ['R', 'S', 'A'], description: 'Priority (R=Routine, S=STAT, A=ASAP)' },
            order_datetime: { type: 'datetime', description: 'Order date/time', example: '20231201140000' }
        }
    }
};

module.exports = astmTemplates;