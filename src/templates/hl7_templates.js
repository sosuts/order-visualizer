const hl7Templates = {
    lab_order: {
        name: 'Laboratory Order Message (ORM^O01)',
        description: 'HL7検査オーダーメッセージ',
        template: `MSH|^~\\&|{sending_app}|{sending_facility}|{receiving_app}|{receiving_facility}|{timestamp}||ORM^O01^ORM_O01|{control_id}|P|2.5
PID|1||{patient_id}^^^{facility}^MR||{patient_name}||{dob}|{sex}|||{address}^USA
ORC|NW|{placer_order}|{filler_order}|||||||^{ordering_provider}
OBR|1|{placer_order}|{filler_order}|{test_code}^{test_name}^L||{order_datetime}|||||||||^{ordering_provider}||||||||||||F`,
        fields: {
            sending_app: { type: 'text', description: 'Sending application', example: 'EMR_SYSTEM' },
            sending_facility: { type: 'text', description: 'Sending facility', example: 'HOSPITAL' },
            receiving_app: { type: 'text', description: 'Receiving application', example: 'LAB_SYSTEM' },
            receiving_facility: { type: 'text', description: 'Receiving facility', example: 'LAB' },
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201120000' },
            control_id: { type: 'text', description: 'Message control ID', example: 'MSG001' },
            patient_id: { type: 'text', description: 'Patient ID', example: '12345' },
            facility: { type: 'text', description: 'Assigning facility', example: 'HOSPITAL' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Smith^John^A' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19850315' },
            sex: { type: 'select', options: ['M', 'F', 'O', 'U'], description: 'Administrative sex' },
            address: { type: 'text', description: 'Patient address', example: '123 Main St^^Any City^CA^90210' },
            placer_order: { type: 'text', description: 'Placer order number', example: 'ORD123' },
            filler_order: { type: 'text', description: 'Filler order number', example: 'ORD123' },
            ordering_provider: { type: 'text', description: 'Ordering provider', example: 'Smith^John^A' },
            test_code: { type: 'text', description: 'Universal service ID', example: 'CBC' },
            test_name: { type: 'text', description: 'Test name', example: 'Complete Blood Count' },
            order_datetime: { type: 'datetime', description: 'Requested date/time', example: '20231201120000' }
        }
    },

    result_message: {
        name: 'Laboratory Result Message (ORU^R01)',
        description: 'HL7検査結果メッセージ',
        template: `MSH|^~\\&|{sending_app}|{sending_facility}|{receiving_app}|{receiving_facility}|{timestamp}||ORU^R01^ORU_R01|{control_id}|P|2.5
PID|1||{patient_id}^^^{facility}^MR||{patient_name}||{dob}|{sex}|||{address}^USA
OBR|1|{placer_order}|{filler_order}|{test_code}^{test_name}^L||{order_datetime}|{result_datetime}||||||||^{ordering_provider}||||||||||||F
OBX|1|NM|{result_code}^{result_name}^L||{result_value}|{units}|{reference_range}|{abnormal_flag}|||F|||{result_datetime}`,
        fields: {
            sending_app: { type: 'text', description: 'Sending application', example: 'LAB_SYSTEM' },
            sending_facility: { type: 'text', description: 'Sending facility', example: 'LAB' },
            receiving_app: { type: 'text', description: 'Receiving application', example: 'EMR_SYSTEM' },
            receiving_facility: { type: 'text', description: 'Receiving facility', example: 'HOSPITAL' },
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201150000' },
            control_id: { type: 'text', description: 'Message control ID', example: 'MSG002' },
            patient_id: { type: 'text', description: 'Patient ID', example: '12345' },
            facility: { type: 'text', description: 'Assigning facility', example: 'HOSPITAL' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Smith^John^A' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19850315' },
            sex: { type: 'select', options: ['M', 'F', 'O', 'U'], description: 'Administrative sex' },
            address: { type: 'text', description: 'Patient address', example: '123 Main St^^Any City^CA^90210' },
            placer_order: { type: 'text', description: 'Placer order number', example: 'ORD123' },
            filler_order: { type: 'text', description: 'Filler order number', example: 'ORD123' },
            ordering_provider: { type: 'text', description: 'Ordering provider', example: 'Smith^John^A' },
            test_code: { type: 'text', description: 'Universal service ID', example: 'CBC' },
            test_name: { type: 'text', description: 'Test name', example: 'Complete Blood Count' },
            order_datetime: { type: 'datetime', description: 'Requested date/time', example: '20231201120000' },
            result_datetime: { type: 'datetime', description: 'Result date/time', example: '20231201150000' },
            result_code: { type: 'text', description: 'Observation identifier', example: 'WBC' },
            result_name: { type: 'text', description: 'Observation name', example: 'White Blood Cell Count' },
            result_value: { type: 'text', description: 'Observation value', example: '7.2' },
            units: { type: 'text', description: 'Units', example: '10*3/uL' },
            reference_range: { type: 'text', description: 'Reference range', example: '4.0-10.0' },
            abnormal_flag: { type: 'select', options: ['N', 'H', 'L', 'HH', 'LL'], description: 'Abnormal flags' }
        }
    },

    admission: {
        name: 'Admit/Discharge/Transfer (ADT^A01)',
        description: 'HL7入院メッセージ',
        template: `MSH|^~\\&|{sending_app}|{sending_facility}|{receiving_app}|{receiving_facility}|{timestamp}||ADT^A01^ADT_A01|{control_id}|P|2.5
EVN|A01|{event_datetime}||||{operator_id}
PID|1||{patient_id}^^^{facility}^MR||{patient_name}||{dob}|{sex}|||{address}^USA||(555)123-4567
NK1|1|{next_of_kin_name}|SPO^Spouse|{nok_address}^USA|(555)234-5678
PV1|1|I|{patient_location}^{room}^{bed}^{facility}||||{attending_doctor}|MED||||||||{attending_doctor}|INP|{admission_type}|||||||||||||||||||{admit_datetime}`,
        fields: {
            sending_app: { type: 'text', description: 'Sending application', example: 'REGISTRATION' },
            sending_facility: { type: 'text', description: 'Sending facility', example: 'HOSPITAL' },
            receiving_app: { type: 'text', description: 'Receiving application', example: 'HIS' },
            receiving_facility: { type: 'text', description: 'Receiving facility', example: 'HOSPITAL' },
            timestamp: { type: 'datetime', description: 'Message timestamp', example: '20231201080000' },
            control_id: { type: 'text', description: 'Message control ID', example: 'MSG003' },
            event_datetime: { type: 'datetime', description: 'Event occurred date/time', example: '20231201080000' },
            operator_id: { type: 'text', description: 'Event operator ID', example: 'NURSE01' },
            patient_id: { type: 'text', description: 'Patient ID', example: '67890' },
            facility: { type: 'text', description: 'Assigning facility', example: 'HOSPITAL' },
            patient_name: { type: 'text', description: 'Patient name (Last^First^Middle)', example: 'Johnson^Mary^L' },
            dob: { type: 'date', description: 'Date of birth (YYYYMMDD)', example: '19900622' },
            sex: { type: 'select', options: ['M', 'F', 'O', 'U'], description: 'Administrative sex' },
            address: { type: 'text', description: 'Patient address', example: '456 Oak Ave^^Some Town^NY^12345' },
            next_of_kin_name: { type: 'text', description: 'Next of kin name', example: 'Johnson^Robert^K' },
            nok_address: { type: 'text', description: 'Next of kin address', example: '456 Oak Ave^^Some Town^NY^12345' },
            patient_location: { type: 'text', description: 'Assigned patient location', example: '3N' },
            room: { type: 'text', description: 'Room number', example: '312' },
            bed: { type: 'text', description: 'Bed number', example: '1' },
            attending_doctor: { type: 'text', description: 'Attending doctor', example: 'Brown^James^M' },
            admission_type: { type: 'select', options: ['E', 'I', 'O', 'P', 'R'], description: 'Admission type (E=Emergency, I=Inpatient, O=Outpatient, P=Preadmit, R=Recurring)' },
            admit_datetime: { type: 'datetime', description: 'Admit date/time', example: '20231201080000' }
        }
    }
};

module.exports = hl7Templates;