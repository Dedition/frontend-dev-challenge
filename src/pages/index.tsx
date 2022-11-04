import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/material.css';
import 'tippy.js/animations/scale.css';
import 'tippy.js/animations/perspective.css';
const Logo = require('../assets/logo.svg') as string;
const SearchIcon = require('../assets/search.svg') as string;


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

  // This custom hook gets the user's location and sets the location state to true if the user allows location access
  const success = (position: GeolocationPosition) => {
    const crd = position.coords;

    // These console logs are for testing purposes

    // console.log('Your current position is:');
    // console.log(`Latitude : ${crd.latitude}`);
    // console.log(`Longitude: ${crd.longitude}`);
    // console.log(`Roughly ${crd.accuracy} meters.`);

    setUserLocation({
      lat: crd.latitude, lng: crd.longitude
    });

    setLocation(true);
  }

  // This custom hook gets the user's location and sets the location state to false if the user does not allow location access
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

  // This function gets the distance from the user to the school and returns it in kilometers
  const getDistance = (school: any) => {
    if (location) {
      const distanceFromUser = distance(userLocation.lat, userLocation.lng, school.coordinates.lat, school.coordinates.long, 'K');
      return distanceFromUser.toFixed(2);
    } else {
      return null;
    }
  }


  const sortSchools = (...schools: Array<any>) => {
    // This function sorts the schools by distance from the user
    // It takes in an array of schools and returns a sorted array of schools based on distance from the user
    // If the user does not allow location access, it will sort the schools alphabetically
    const mappedSchools = schools[0].schools?.map((school: any) => school);

    if (location) {
      return mappedSchools?.sort((a: any, b: any) => {
        const distanceA = distance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.long, 'K');
        const distanceB = distance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.long, 'K');

        return distanceA - distanceB;
      })
    } else {
      return mappedSchools?.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  }


  /*
  This function searches for a school in the list of schools by taking in the school name and searching for it in the list of schools.
  It searches via the id of the li element and scrolls to the school if it exists.
  If the school name is less than 4 characters, it will alert the user to enter a valid school name.
  I add a highlight class to the school name for 3 seconds when the user searches for a school and it exists for better visibility.
  The setTimeout function removes the highlight class after 3 seconds.
  */
  const searchSchools = (schoolName: string) => {
    const school = schools.schools?.find((school: any) => school.name.toLowerCase().includes(schoolName.toLowerCase()));
    const schoolElement = document.getElementById(schoolName);

    if (schoolName.length < 4) alert('Please enter a valid school name with more than 3 characters.');

    if (schoolElement) {
      schoolElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      schoolElement.classList.add(styles.highlight);
      setTimeout(() => {
        schoolElement.classList.remove(styles.highlight);
      }, 3000);
    } else if (school) {
      document.getElementById(school.name).scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(school.name).classList.add(styles.highlight);
      setTimeout(() => {
        document.getElementById(school.name).classList.remove(styles.highlight);
        setHoveredSchool(null);
      }, 4500);
    } else {
      alert(`Sorry, we couldn't find ${schoolName}.`);
    }

    setSearchQuery('');
  }

  const handleSearch = (e: any) => {
    e.preventDefault();
    searchSchools(searchQuery);
  }


  const handleSearchChange = (e: any) => setSearchQuery(e.target.value);

  const handleHover = (school: any) => setHoveredSchool(school);

  const handleHoverLeave = () => setHoveredSchool(null);


  useEffect(() => {
    getSchools();
    navigator.geolocation.getCurrentPosition(success, error, options);
    // Empty dependency array so the function only runs once
  }, []);


  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <div className={styles.header__logo}>
          {/* Add anchor tag href to logo */}
          <Link
            href="https://www.sendbeacon.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={Logo} alt="Beacon Logo" className={styles.beacon__logo} />
          </Link>
          <p>Beacon</p>
        </div>
      </div>
      <div className={styles.container}>
        <h1 className={styles.search__title}>Pick Your School</h1>
        <form className={styles.search} onSubmit={handleSearch}>
          <button type="submit" onClick={handleSearch} className={styles.search__button} disabled={!searchQuery}>
            <Image src={SearchIcon} alt="Search Icon" className={styles.search__icon} />
          </button>
          <input
            type="text"
            placeholder="Search for your school..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </form>
        <div className={styles.search__container}>
          <ul className={styles.search__unordered}>
            {sortSchools(schools)?.map((school: any) => (
              <li
                key={school.id}
                className={styles.school_id}
              >
                <div className={styles.school__container} id={school.name} onMouseEnter={() => handleHover(school)} onMouseLeave={handleHoverLeave}>
                  {/*
                  This conditional statement checks if the window width is greater than 600px.
                  If it is, it will render the Tippy tooltip.
                  */}
                  {window.innerWidth > 600 ? (
                    <Tippy
                      theme='material'
                      interactive={false}
                      placement='right'
                      arrow={true}
                      animation='scale'
                      content={
                        <div className={styles.tippyTooltip__text}>
                          <p> This is a {school.type.toLowerCase()} school </p>
                          <p> This school is found in {school.state}, {school.county}  </p>
                          <p> Highest attainable degree here is a {school.highestDegree} </p>
                          {location ? (
                            <p className={styles.distanceUser}>This school is <em>{getDistance(school)}km</em> away from you</p>
                          ) : (
                            <p className={styles.enableHighAccuracy}>Enable location to see how far away {school.name} is from you</p>
                          )}
                        </div>
                      }>
                      <div className={styles.school__info}>
                        <p className={styles.school__name} id={school.name}> {school.name} </p>
                        <p className={styles.school__county}> {school.county.replace('County', '')} </p>
                      </div>
                    </Tippy>
                  ) : (
                    <Tippy
                      theme='material'
                      interactive={false}
                      placement='top'
                      arrow={true}
                      animation='perspective'
                      content={
                        <div className={styles.tippyTooltip__text}>
                          <p> This is a {school.type.toLowerCase()} school </p>
                          <p> This school is found in {school.state}, {school.county} </p>
                          <p> Highest attainable degree here is a {school.highestDegree} </p>
                          {/*
                          This conditional statement checks if the user has allowed location access.
                          */}
                          {location ? (
                            <p className={styles.distanceUser}>This school is <em>{getDistance(school)}km</em> away from you</p>
                          ) : (
                            <p className={styles.enableHighAccuracy}>Enable location to see how far away {school.name} is from you</p>
                          )}
                        </div>
                      }>
                      <div className={styles.school__info}>
                        <p className={styles.school__name} id={school.name}> {school.name} </p>
                        <p className={styles.school__county}> {school.county.replace('County', '')} </p>
                      </div>
                    </Tippy>
                  )}
                  <p className={styles.school__letter}> {school.name[0]} </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

  )
}


// state then county or county then state
// Typically you goo
