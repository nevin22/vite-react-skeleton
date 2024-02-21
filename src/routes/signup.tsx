import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

export default function Signup() {
  const navigate = useNavigate();

  const redirectToHomePage = () => {
    navigate('/');
  };

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string()
        .max(15, 'Must be 15 characters or less')
        .required('Required'),
      lastName: Yup.string()
        .max(20, 'Must be 20 characters or less')
        .required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
    }),
    onSubmit: values => {
      // alert(JSON.stringify(values, null, 2));
      redirectToHomePage();
    },
  });


  return (
    <form onSubmit={formik.handleSubmit} className='flex flex-col'>
      <label htmlFor="firstName">First Name</label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.firstName}
      />
      {formik.touched.firstName && formik.errors.firstName ? (
        <div className='mb-5' >{formik.errors.firstName}</div>
      ) : <div className='mb-5' />}

      <label htmlFor="lastName">Last Name</label>
      <input
        id="lastName"
        name="lastName"
        type="text"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.lastName}
      />
      {formik.touched.lastName && formik.errors.lastName ? (
        <div className='mb-5'  style={{ color: 'red' }}>{formik.errors.lastName}</div>
      ) : <div className='mb-5' />}

      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        name="email"
        type="email"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.email}
      />
      {formik.touched.email && formik.errors.email ? (
        <div className='mb-5' style={{ color: 'red' }}>{formik.errors.email}</div>
      ) : <div className='mb-5' />}


      <button type="submit">Submit</button>
    </form>
  );
};