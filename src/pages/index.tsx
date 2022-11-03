import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'
import Image from 'next/image'


export default function Home() {
  const api_url = 'https://api.sendbeacon.com/team/schools';
  const [schools, setSchools] = useState([]);
  const [location, setLocation] = useState(false);
  const [userLocation, setUserLocation] = useState({
    lat: 0,
    lng: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSchool, setHoveredSchool] = useState(null);


  const getSchools = async () => {
    const response = await fetch(api_url);
    const data = await response.json();
    setSchools(data);
  }

  const success = (position: GeolocationPosition) => {
    const crd = position.coords;

    console.log('Your current position is:');
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`Roughly ${crd.accuracy} meters.`);

    setUserLocation({
      lat: crd.latitude,
      lng: crd.longitude
    });

    setLocation(true);
  }

  const error = (err: GeolocationPositionError) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);

    setLocation(false);
  }

  const options = {
    enableHighAccuracy: true, // Will use GPS if available
    timeout: 5000, // Timeout after 5 seconds
    maximumAge: 0 // Disable cache - always get fresh position
  };


  const distance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: string) => {
    // This function is from https://www.geodatasource.com/developers/javascript and is used to calculate the distance between two points

    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    } else {
      const radlat1 = Math.PI * lat1 / 180;
      const radlat2 = Math.PI * lat2 / 180;
      const theta = lon1 - lon2;
      const radtheta = Math.PI * theta / 180;

      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

      if (dist > 1) dist = 1;

      dist = Math.acos(dist);
      dist = dist * 180 / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == "K") { dist = dist * 1.609344 }
      if (unit == "N") { dist = dist * 0.8684 }
      return dist;
    }
  }

  const sortSchools = (...schools: Array<any>) => {
    // This function sorts the schools by distance from the user
    // It takes in an array of schools and returns a sorted array of schools based on distance from the user
    const mappedSchools = schools[0].map.schools?.map((school: any) => school)

    if (location) {
      return mappedSchools?.sort((a: any, b: any) => {
        const distanceA = distance(userLocation.lat, userLocation.lng, a.lat, a.lng, 'K');
        const distanceB = distance(userLocation.lat, userLocation.lng, b.lat, b.lng, 'K');

        return distanceA - distanceB;
      })
    } else {
      return mappedSchools?.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  }

  const searchSchools = (schoolName: string) => {
    const school = schools.schools?.find((school: any) => school.name.toLowerCase().includes(schoolName.toLowerCase()));
    const schoolElement = document.getElementById(schoolName);

    if (schoolName.length < 5 || !school) alert('Please enter a valid school name');

    if (schoolElement) {
      schoolElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (school) {
      document.getElementById(school.name)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(`Sorry, we couldn't find '${schoolName}'. Please try again.`);
    }

    setSearchQuery('');
  }

  const handleSearch = (e: any) => {
    e.preventDefault();
    searchSchools(searchQuery);
  }

  const handleSchoolClick = (school: any) => {
    const schoolElement = document.getElementById(school.name);

    if (schoolElement) {
      schoolElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const handleSearchChange = (e: any) => setSearchQuery(e.target.value);

  const handleHover = (school: any) => setHoveredSchool(school);

  const handleHoverLeave = () => setHoveredSchool(null);

  // const handleKeyPress = (e: any) => {
  //   if (e.key === 'Enter') {
  //     searchSchools(searchQuery);
  //   }
  // }



  useEffect(() => {
    getSchools();
    navigator.geolocation.getCurrentPosition(success, error, options);
    // Empty dependency array so the function only runs once
  }, []);


  return (
    <div className={styles.body}>

    </div>
  )
}
